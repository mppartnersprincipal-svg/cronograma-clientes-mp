# CLAUDE.md — Content Agent (M|P Assessoria)

## Visão Geral do Projeto

Sistema interno da M|P Assessoria para geração de roteiros (vídeos/Reels) e briefings (peças estáticas/carrossel) com base em IA. O agente lê a base de conhecimento de cada cliente e conduz um fluxo conversacional para produzir os entregáveis com qualidade e velocidade.

---

## Stack Técnica

- **Framework:** Next.js 14+ com App Router
- **Linguagem:** TypeScript (strict mode)
- **IA:** Anthropic Claude API (`claude-sonnet-4-20250514`) com streaming via Vercel AI SDK
- **Banco de dados:** SQLite via Prisma (histórico de conteúdos gerados)
- **UI:** shadcn/ui + Tailwind CSS
- **Leitura de arquivos:** `pdf-parse` (PDF), `mammoth` (DOCX), `gray-matter` (Markdown)
- **Busca web:** Anthropic web_search tool (para pesquisa de tendências do nicho)

---

## Estrutura de Diretórios

```
/content-agent/
├── /clients/                          ← BASE DE CONHECIMENTO (não modificar via código)
│   └── /{slug-do-cliente}/
│       ├── info.md                    ← Perfil do cliente (obrigatório)
│       ├── manual-marca.pdf           ← Opcional
│       ├── /roteiros-aprovados/       ← .md ou .txt com roteiros já produzidos
│       └── /briefings-aprovados/      ← .md ou .txt com briefings já produzidos
│
├── /src/
│   ├── /app/
│   │   ├── /api/
│   │   │   ├── /clients/route.ts      ← Lista clientes da pasta /clients/
│   │   │   ├── /knowledge/route.ts    ← Lê e agrega arquivos de um cliente
│   │   │   └── /agent/route.ts        ← Stream do agente (POST, streaming SSE)
│   │   ├── /dashboard/page.tsx        ← Interface principal
│   │   └── layout.tsx
│   │
│   ├── /lib/
│   │   ├── claude.ts                  ← Wrapper da Claude API + streaming
│   │   ├── knowledge-base.ts          ← Lê arquivos do cliente e retorna contexto
│   │   ├── /prompts/
│   │   │   ├── system.ts              ← System prompt base do agente
│   │   │   ├── reels-valor.ts
│   │   │   ├── reels-institucional.ts
│   │   │   ├── anuncio.ts
│   │   │   ├── peca-estatica.ts
│   │   │   └── carrossel.ts
│   │   └── /frameworks/
│   │       ├── copy-frameworks.ts     ← AIDA, PAS, StoryBrand, Gancho/Corpo/CTA
│   │       └── content-types.ts       ← Tipos de conteúdo e suas regras
│   │
│   └── /components/
│       ├── ClientSelector.tsx         ← Grid de seleção de cliente
│       ├── AgentChat.tsx              ← Interface conversacional com streaming
│       ├── ContentOutput.tsx          ← Roteiro/briefing formatado + ações
│       └── IdeaApproval.tsx           ← Cards de ideias para aprovar antes de gerar
│
├── /prisma/
│   └── schema.prisma
├── CLAUDE.md                          ← Este arquivo
└── PRD.md                             ← Documento de requisitos
```

---

## Fluxo do Agente (obrigatório respeitar esta ordem)

```
ETAPA 1 — Seleção de cliente
  → Usuário escolhe o cliente na tela inicial
  → Sistema carrega automaticamente a base de conhecimento do cliente

ETAPA 2 — Tipo de conteúdo
  → Agente pergunta: "Que tipo de conteúdo você quer criar?"
  → Opções: Reels de Valor | Reels Institucional | Anúncio | Peça Estática | Carrossel

ETAPA 3 — Pesquisa e ideias
  → Agente faz web_search sobre tendências do nicho do cliente
  → Agente lê roteiros/briefings aprovados anteriores (evitar repetição de ângulo)
  → Agente apresenta 3–5 ideias de conteúdo para o usuário aprovar
  → Usuário escolhe uma ideia (ou pede nova sugestão)

ETAPA 4 — Coleta de informações adicionais
  → Agente confirma/ajusta: tom de voz, CTA desejado, duração (se vídeo), formato (se peça)
  → Perguntas são pré-preenchidas com base no info.md do cliente

ETAPA 5 — Geração do conteúdo
  → Agente seleciona o framework de copy adequado ao tipo de conteúdo
  → Gera o roteiro ou briefing completo via streaming
  → Exibe o resultado formatado na interface

ETAPA 6 — Aprovação e salvamento
  → Usuário aprova, edita ou pede nova versão
  → Conteúdo aprovado é salvo em /clients/{cliente}/roteiros-aprovados/ (ou briefings)
  → Registro salvo no SQLite (cliente, tipo, data, título, status)
```

---

## Regras de Implementação

### Base de conhecimento
- A pasta `/clients/` é lida apenas em runtime, nunca modificada por código (exceto para salvar aprovados)
- Suporte a formatos: `.md`, `.txt`, `.pdf`, `.docx`
- Limite de contexto: no máximo 80.000 tokens por requisição ao Claude (truncar se necessário)
- Prioridade de leitura: `info.md` > `manual-marca.*` > roteiros/briefings aprovados (mais recentes primeiro)

### IA e prompts
- Sempre usar `claude-sonnet-4-20250514`
- Streaming obrigatório para todas as respostas do agente (usar Vercel AI SDK `streamText`)
- O system prompt deve incluir SEMPRE: (1) perfil do cliente, (2) histórico de conteúdos, (3) framework de copy ativo, (4) instrução de idioma (português brasileiro, informal mas profissional)
- Agente NUNCA repete ângulos já usados nos roteiros/briefings aprovados

### Frameworks de copy disponíveis

| Tipo de conteúdo | Framework padrão | Alternativo |
|---|---|---|
| Reels de Valor | Gancho / Corpo / CTA | StoryBrand |
| Reels Institucional | StoryBrand | AIDA |
| Anúncio (Meta/Google) | PAS (Problema/Agitação/Solução) | AIDA |
| Peça Estática | Headline + Suporte + CTA | — |
| Carrossel | Slide 1 = Gancho, Slides 2–N = Valor, Último = CTA | — |

### Banco de dados (SQLite)
- Tabela `content_history`: id, client_slug, content_type, title, framework, created_at, status (draft/approved)
- Tabela `clients`: slug, name, niche, created_at
- Não usar migrations automáticas em dev — usar `prisma db push`

### UI/UX
- Interface em português brasileiro
- Tema escuro por padrão (dark mode)
- Sidebar com lista de clientes
- Área principal = chat conversacional com o agente
- Quando o agente gerar o conteúdo final, exibir em painel separado com botões: "Aprovar e Salvar" | "Pedir nova versão" | "Copiar"

---

## Arquivo info.md (formato padrão por cliente)

Cada cliente deve ter um `info.md` com esta estrutura:

```markdown
---
name: Nome do Cliente
slug: nome-do-cliente
niche: Materiais de Construção
location: Goiânia, GO
---

## Sobre o Cliente
[Descrição geral do negócio]

## Público-Alvo
[Descrição da persona principal]

## Tom de Voz
[Ex: Direto, próximo, sem formalidades excessivas. Usa gírias do setor.]

## Diferenciais
[O que torna esse cliente único]

## Produtos/Serviços Principais
[Lista dos principais produtos ou serviços]

## Redes Sociais
- Instagram: @handle
- Facebook: /pagina

## Observações Importantes
[Qualquer instrução especial para produção de conteúdo]
```

---

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# Criar/atualizar banco
npx prisma db push

# Visualizar banco
npx prisma studio

# Build para produção
npm run build
```

---

## Variáveis de Ambiente (.env.local)

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL="file:./dev.db"
```

---

## Sistema de Copywriters

O sistema injeta automaticamente 2 copywriters (primário + secundário) no system prompt de cada geração de conteúdo, baseado no tipo de conteúdo e nicho do cliente.

### Localização dos arquivos

```
/src/lib/copywriters/
├── index.ts          ← Registro de todos os copywriters (id, name, icon, tier, strengths, bestFor)
├── selector.ts       ← selectCopywriters(contentType, niche) → CopywriterPair
├── loader.ts         ← loadCopywriterContext(id) → string (máx. 3.000 tokens)
├── *.md              ← Arquivos de conhecimento de cada copywriter (20 arquivos)
└── /src/lib/prompts/system.ts  ← buildCopywriterBlock() injeta o par no system prompt
```

### Como o selector funciona

1. Detecta a categoria de nicho: `construcao | saude | educacao | varejo | servicos-locais | default`
2. Aplica a lógica de seleção por tipo de conteúdo (com ajustes por nicho)
3. Retorna `CopywriterPair` com: primary, secondary, combinationInstruction, whyPrimary, whySecondary

### Pares padrão por tipo de conteúdo

| Tipo | Primário | Secundário |
|------|----------|------------|
| Reels de Valor | Gary Halbert | Frank Kern |
| Reels Institucional | David Ogilvy | Russell Brunson |
| Anúncio | Dan Kennedy | Gary Bencivenga |
| Peça Estática | Claude Hopkins | David Deutsch |
| Carrossel | Joe Sugarman | Parris Lampropoulos |

Nichos de saúde usam Robert Collier + Eugene Schwartz para Reels de Valor, e Clayton Makepeace + Gary Bencivenga para Anúncio. Nichos de construção/serviços locais favorecem Kennedy, Halbert e Carlton.

### Como adicionar um novo copywriter

1. Crie `/src/lib/copywriters/{id}.md` seguindo o formato YAML dos existentes (seções obrigatórias: `core_frameworks`, `core_principles`, `writing_style`, `## How [Name] Thinks`)
2. Adicione a entrada em `index.ts` com id, name, icon, title, tier, strengths e bestFor
3. Opcionalmente, adicione pares e instruções de combinação em `selector.ts`

### Limite de tokens por copywriter

- Máximo de **3.000 tokens por copywriter** (~12.000 caracteres) extraídos pelo `loader.ts`
- Total de **6.000 tokens** para o par completo no system prompt
- O loader descarta: `biography`, `famous_works`, `relationships`, `persona_profile`, `persona`, `agent`
- O loader mantém: `core_frameworks`, `core_principles`, `writing_style`, `## How [Name] Thinks`

### Endpoint de seleção

`GET /api/copywriters?contentType={tipo}&niche={nicho}` — retorna o `CopywriterPair` como JSON.
Chamado pelo frontend ao selecionar o tipo de conteúdo para exibir o badge e popular o seletor manual.

---

## Convenções de Código

- Componentes: PascalCase
- Funções utilitárias: camelCase
- Arquivos de rota API: sempre `route.ts`
- Sem `any` no TypeScript — usar tipos explícitos
- Comentários em português quando explicarem lógica de negócio
- Comentários em inglês em código genérico/técnico
