import { streamText, type ModelMessage } from 'ai';
import { NextRequest } from 'next/server';
import { claude, anthropic } from '@/lib/claude';
import { loadClientKnowledge, type ClientKnowledge } from '@/lib/knowledge-base';
import { buildPrompt as buildReelsValor } from '@/lib/prompts/reels-valor';
import { buildPrompt as buildReelsInstitucional } from '@/lib/prompts/reels-institucional';
import { buildPrompt as buildAnuncio } from '@/lib/prompts/anuncio';
import { buildPrompt as buildPecaEstatica } from '@/lib/prompts/peca-estatica';
import { buildPrompt as buildCarrossel } from '@/lib/prompts/carrossel';
import { selectCopywriters } from '@/lib/copywriters/selector';
import { loadCopywriterContext } from '@/lib/copywriters/loader';
import { buildCopywriterBlock } from '@/lib/prompts/system';
import { COPYWRITERS } from '@/lib/copywriters/index';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ContentType =
  | 'reels-valor'
  | 'reels-institucional'
  | 'anuncio'
  | 'peca-estatica'
  | 'carrossel';

type Stage = 'ideas' | 'info-gathering' | 'generation' | 'revision';

interface AgentRequestBody {
  clientSlug: string;
  clientNiche?: string;
  contentType: ContentType;
  messages: ModelMessage[];
  stage: Stage;
  ideaTitle?: string;
  extraInfo?: string;
  scriptCount?: number;
  selectedIdeas?: { title: string; angle: string; hook: string }[];
  primaryCopywriterId?: string;
  secondaryCopywriterId?: string;
}

// ─── Labels legíveis ─────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'reels-valor': 'Reels de Valor',
  'reels-institucional': 'Reels Institucional',
  anuncio: 'Anúncio (Meta/Google Ads)',
  'peca-estatica': 'Peça Estática',
  carrossel: 'Carrossel',
};

// ─── Seleção de prompt por tipo de conteúdo ──────────────────────────────────

function buildGenerationPrompt(
  knowledge: ClientKnowledge,
  contentType: ContentType,
  ideaTitle: string,
  extraInfo: string
): string {
  switch (contentType) {
    case 'reels-valor':
      return buildReelsValor(knowledge, ideaTitle, extraInfo);
    case 'reels-institucional':
      return buildReelsInstitucional(knowledge, ideaTitle, extraInfo);
    case 'anuncio':
      return buildAnuncio(knowledge, ideaTitle, extraInfo);
    case 'peca-estatica':
      return buildPecaEstatica(knowledge, ideaTitle, extraInfo);
    case 'carrossel':
      return buildCarrossel(knowledge, ideaTitle, extraInfo);
  }
}

// ─── Contexto de copywriters ─────────────────────────────────────────────────

/**
 * Carrega o contexto dos 2 copywriters selecionados e retorna o bloco
 * de injeção para o system prompt. Silencia erros — se os arquivos não
 * existirem, o agente funciona normalmente sem copywriters.
 */
async function loadCopywriterInjection(
  contentType: ContentType,
  niche: string,
  primaryId?: string,
  secondaryId?: string,
): Promise<string> {
  try {
    // Seleciona o par automaticamente; usa IDs do frontend se fornecidos (override manual)
    const autoPair = selectCopywriters(contentType, niche);
    const resolvedPrimaryId = primaryId ?? autoPair.primary.id;
    const resolvedSecondaryId = secondaryId ?? autoPair.secondary.id;

    // Usa a instrução de combinação do par automático se os IDs coincidirem,
    // senão gera uma instrução genérica para o par manual
    const combinationInstruction =
      resolvedPrimaryId === autoPair.primary.id &&
      resolvedSecondaryId === autoPair.secondary.id
        ? autoPair.combinationInstruction
        : `${COPYWRITERS[resolvedPrimaryId]?.name ?? resolvedPrimaryId} lidera a estrutura principal do conteúdo. ${COPYWRITERS[resolvedSecondaryId]?.name ?? resolvedSecondaryId} reforça os pontos críticos de persuasão.`;

    const [primaryCtx, secondaryCtx] = await Promise.all([
      loadCopywriterContext(resolvedPrimaryId),
      loadCopywriterContext(resolvedSecondaryId),
    ]);

    const primaryInfo = COPYWRITERS[resolvedPrimaryId];
    const secondaryInfo = COPYWRITERS[resolvedSecondaryId];

    return buildCopywriterBlock({
      primaryName: primaryInfo?.name ?? resolvedPrimaryId,
      primaryRole: primaryInfo?.title ?? '',
      primaryContext: primaryCtx,
      secondaryName: secondaryInfo?.name ?? resolvedSecondaryId,
      secondaryRole: secondaryInfo?.title ?? '',
      secondaryContext: secondaryCtx,
      combinationInstruction,
    });
  } catch {
    // Falha silenciosa — não interrompe a geração
    return '';
  }
}

// ─── System prompts por stage ────────────────────────────────────────────────

function buildIdeasSystemPrompt(
  knowledge: ClientKnowledge,
  contentType: ContentType,
  copywriterBlock: string
): string {
  const label = CONTENT_TYPE_LABELS[contentType];

  const anglesBlock =
    knowledge.approvedAngles.length > 0
      ? knowledge.approvedAngles
          .map((a, i) => `### Conteúdo ${i + 1}\n${a}`)
          .join('\n\n')
      : 'Nenhum conteúdo aprovado ainda. Sem restrições de ângulo.';

  return `Você é um estrategista de conteúdo especializado em redes sociais. Sua tarefa é pesquisar tendências e sugerir ideias criativas para ${label}.

Você escreve e pensa em português brasileiro.

${copywriterBlock}

---

## BASE DE CONHECIMENTO DO CLIENTE

${knowledge.fullContext}

---

## ÂNGULOS JÁ UTILIZADOS (não repita)

${anglesBlock}

---

## INSTRUÇÕES

1. Use a ferramenta web_search para pesquisar tendências atuais do nicho do cliente (combine o nicho com termos como "tendência 2026", "conteúdo viral 2026", "Instagram ${label} 2026"). Priorize resultados de 2026 — ignore conteúdos de 2024 ou anteriores.
2. Com base na pesquisa e no perfil do cliente, sugira entre 3 e 5 ideias de conteúdo do tipo **${label}**.
3. Cada ideia deve ser diferente em ângulo e abordagem das anteriores.
4. Ao final, apresente as ideias no seguinte formato JSON dentro de um bloco de código:

\`\`\`json
{
  "ideas": [
    {
      "title": "Título curto da ideia",
      "angle": "Descrição do ângulo/abordagem (1–2 frases)",
      "hook": "Frase de gancho sugerida para abrir o conteúdo"
    }
  ]
}
\`\`\`

Antes do JSON, escreva um parágrafo curto resumindo o que a pesquisa revelou sobre tendências do nicho.`;
}

function buildInfoGatheringSystemPrompt(
  knowledge: ClientKnowledge,
  contentType: ContentType
): string {
  const label = CONTENT_TYPE_LABELS[contentType];

  const questions: Record<ContentType, string> = {
    'reels-valor': `- Duração desejada (15s, 30s ou 60s)? Padrão: 30s.
- Há um CTA específico (ex: "visita a loja", "link na bio", "manda mensagem")?
- O tom de voz precisa de algum ajuste para esse conteúdo?`,
    'reels-institucional': `- Duração desejada (15s, 30s ou 60s)? Padrão: 30s.
- Há um evento, data comemorativa ou campanha específica que inspire este vídeo?
- CTA desejado (ex: "seguir o perfil", "entrar em contato", "visitar a loja")?`,
    anuncio: `- Plataforma principal: Meta Ads (Instagram/Facebook), Google Ads ou ambos?
- Objetivo da campanha: tráfego, conversão, geração de leads ou awareness?
- Há uma oferta ou promoção específica a destacar?
- CTA do botão: "Saiba Mais", "Enviar Mensagem", "Comprar Agora" ou outro?`,
    'peca-estatica': `- Formato prioritário: feed quadrado (1:1), retrato (4:5) ou story (9:16)?
- Há um produto, serviço ou promoção específica a destacar?
- O post tem objetivo de venda, engajamento ou posicionamento?`,
    carrossel: `- Número de slides desejado (padrão: 7, máximo: 10)?
- Objetivo: educativo, vendas ou engajamento/salvamento?
- Há algum produto ou subtema específico dentro do tema escolhido?`,
  };

  return `Você é o assistente de criação de conteúdo da M|P Assessoria. Sua função agora é coletar as informações finais para gerar um(a) **${label}** para o cliente.

Você escreve em português brasileiro, de forma direta e amigável.

---

## PERFIL DO CLIENTE

${knowledge.profile}

---

## INSTRUÇÕES

Faça as perguntas abaixo de forma conversacional — não as liste mecanicamente. Se o usuário já respondeu alguma delas nas mensagens anteriores, pule-a.

Quando todas as informações estiverem coletadas, confirme com o usuário e diga que está pronto para gerar o conteúdo.

**Informações a coletar para ${label}:**
${questions[contentType]}

Se o cliente tiver um tom de voz definido no perfil acima, use-o como padrão e mencione isso ao usuário — pergunte apenas se deseja ajustar.`;
}

function buildRevisionSystemPrompt(
  knowledge: ClientKnowledge,
  contentType: ContentType,
  copywriterBlock: string
): string {
  const label = CONTENT_TYPE_LABELS[contentType];

  return `Você é o assistente de criação de conteúdo da M|P Assessoria. Você acabou de gerar um(a) **${label}** para o cliente e agora deve aplicar as revisões solicitadas.

Você escreve em português brasileiro.

${copywriterBlock}

---

## PERFIL DO CLIENTE

${knowledge.profile}

---

## INSTRUÇÕES

- Leia atentamente o conteúdo gerado anteriormente (disponível no histórico da conversa).
- Aplique as modificações solicitadas pelo usuário mantendo o framework de copy e o tom de voz do cliente.
- Retorne o conteúdo completo revisado — não apenas os trechos alterados.
- Se a solicitação for ambígua, pergunte antes de gerar.`;
}

// ─── Validação do body ────────────────────────────────────────────────────────

const VALID_CONTENT_TYPES: ContentType[] = [
  'reels-valor',
  'reels-institucional',
  'anuncio',
  'peca-estatica',
  'carrossel',
];

const VALID_STAGES: Stage[] = [
  'ideas',
  'info-gathering',
  'generation',
  'revision',
];

function isValidBody(body: unknown): body is AgentRequestBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.clientSlug === 'string' &&
    VALID_CONTENT_TYPES.includes(b.contentType as ContentType) &&
    Array.isArray(b.messages) &&
    VALID_STAGES.includes(b.stage as Stage)
  );
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isValidBody(body)) {
    return new Response(
      JSON.stringify({
        error:
          'Campos obrigatórios: clientSlug, contentType, messages, stage',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    clientSlug,
    clientNiche = '',
    contentType,
    messages,
    stage,
    ideaTitle = '',
    extraInfo = '',
    scriptCount = 1,
    selectedIdeas,
    primaryCopywriterId,
    secondaryCopywriterId,
  } = body;

  let knowledge: ClientKnowledge;
  try {
    knowledge = await loadClientKnowledge(clientSlug);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao carregar cliente';
    return new Response(JSON.stringify({ error: msg }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Monta system prompt e configurações conforme o stage
  let systemPrompt: string;
  let useWebSearch = false;

  switch (stage) {
    case 'ideas': {
      const copywriterBlock = await loadCopywriterInjection(
        contentType,
        clientNiche,
        primaryCopywriterId,
        secondaryCopywriterId,
      );
      systemPrompt = buildIdeasSystemPrompt(knowledge, contentType, copywriterBlock);
      useWebSearch = true;
      break;
    }

    case 'info-gathering':
      systemPrompt = buildInfoGatheringSystemPrompt(knowledge, contentType);
      break;

    case 'generation': {
      const hasMultipleIdeas = selectedIdeas && selectedIdeas.length > 1;
      const primaryTitle = ideaTitle || selectedIdeas?.[0]?.title || '';

      if (!primaryTitle) {
        return new Response(
          JSON.stringify({ error: 'ideaTitle é obrigatório no stage "generation"' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const copywriterBlock = await loadCopywriterInjection(
        contentType,
        clientNiche,
        primaryCopywriterId,
        secondaryCopywriterId,
      );

      if (hasMultipleIdeas) {
        // Gera um roteiro completo por ideia selecionada
        const basePrompt = buildGenerationPrompt(knowledge, contentType, primaryTitle, extraInfo);
        systemPrompt = copywriterBlock ? copywriterBlock + '\n\n' + basePrompt : basePrompt;
        systemPrompt += `\n\n---\n\n## ROTEIROS MÚLTIPLOS\n\nO usuário selecionou **${selectedIdeas!.length} ideias diferentes**. Gere um roteiro completo para cada uma delas, na ordem abaixo. Separe cada roteiro com "---" e numere como **Roteiro 1 — {título}**, **Roteiro 2 — {título}**, etc.\n\n${selectedIdeas!.map((idea, i) => `**${i + 1}. ${idea.title}**\nÂngulo: ${idea.angle}\nGancho sugerido: "${idea.hook}"`).join('\n\n')}`;
      } else {
        const basePrompt = buildGenerationPrompt(knowledge, contentType, primaryTitle, extraInfo);
        systemPrompt = copywriterBlock ? copywriterBlock + '\n\n' + basePrompt : basePrompt;

        if (scriptCount > 1) {
          systemPrompt += `\n\n---\n\n## QUANTIDADE DE ROTEIROS\n\nO usuário solicitou **${scriptCount} roteiros** diferentes. Gere ${scriptCount} versões completas e distintas, numeradas como **Roteiro 1**, **Roteiro 2**, etc. Cada versão deve ter um gancho diferente e abordagem levemente distinta, mas mantendo o mesmo tema e framework de copy. Separe cada roteiro com uma linha horizontal (---).`;
        }
      }
      break;
    }

    case 'revision': {
      const copywriterBlock = await loadCopywriterInjection(
        contentType,
        clientNiche,
        primaryCopywriterId,
        secondaryCopywriterId,
      );
      systemPrompt = buildRevisionSystemPrompt(knowledge, contentType, copywriterBlock);
      break;
    }
  }

  const result = streamText({
    model: claude,
    system: systemPrompt,
    messages,
    ...(useWebSearch && {
      tools: {
        web_search: anthropic.tools.webSearch_20250305({ maxUses: 5 }),
      },
      maxSteps: 8, // permite múltiplos ciclos de busca + síntese
    }),
  });

  return result.toTextStreamResponse();
}
