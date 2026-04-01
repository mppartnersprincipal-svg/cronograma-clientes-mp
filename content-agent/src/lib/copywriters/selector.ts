import { COPYWRITERS, type ContentType, type CopywriterInfo } from './index';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CopywriterPair {
  primary: CopywriterInfo;
  secondary: CopywriterInfo;
  combinationInstruction: string;
  whyPrimary: string;
  whySecondary: string;
}

// ─── Instruções de combinação por par ────────────────────────────────────────

const COMBINATION_INSTRUCTIONS: Record<string, string> = {
  'gary-halbert+frank-kern':
    'Halbert lidera a estrutura emocional e storytelling. Kern reforça autenticidade e results in advance no CTA.',
  'robert-collier+eugene-schwartz':
    'Collier cria a conexão empática e a cena mental no gancho. Schwartz usa o nível de consciência do mercado para calibrar a intensidade da mensagem.',
  'gary-halbert+john-carlton':
    'Halbert lidera com storytelling de rua e emoção bruta. Carlton encontra o ângulo de venda oculto e mantém o copy com poder de entretenimento.',
  'david-ogilvy+russell-brunson':
    'Ogilvy define o brand image e big idea. Brunson estrutura o hook e a epiphany bridge.',
  'david-ogilvy+robert-collier':
    'Ogilvy estabelece o brand image e a big idea aspiracional. Collier constrói a conexão emocional e a cena mental que convence.',
  'dan-kennedy+gary-bencivenga':
    'Kennedy constrói a oferta e urgência com PAS. Bencivenga adiciona as camadas de prova após cada claim.',
  'clayton-makepeace+gary-bencivenga':
    'Makepeace identifica e amplifica a emoção dominante residente. Bencivenga constrói a equação de persuasão com prova irrefutável.',
  'dan-kennedy+john-carlton':
    'Kennedy define a oferta irresistível e urgência. Carlton encontra o ângulo de venda mais direto e entertainante para serviços locais.',
  'claude-hopkins+david-deutsch':
    'Hopkins define os claims específicos e reason-why. Deutsch encontra o big idea que unifica o conteúdo.',
  'claude-hopkins+dan-kennedy':
    'Hopkins constrói os claims com especificidade científica. Kennedy transforma esses claims em uma oferta irresistível com urgência real.',
  'joe-sugarman+parris-lampropoulos':
    'Sugarman garante o slippery slide entre slides. Lampropoulos escreve os bullets/hooks de cada slide.',
  'joe-sugarman+david-deutsch':
    'Sugarman garante o slippery slide e os gatilhos psicológicos em cada slide. Deutsch encontra a big idea que transforma um carrossel comum em algo inesquecível.',
};

function getCombinationInstruction(primaryId: string, secondaryId: string): string {
  const key = `${primaryId}+${secondaryId}`;
  return (
    COMBINATION_INSTRUCTIONS[key] ??
    `${COPYWRITERS[primaryId]?.name ?? primaryId} lidera a estrutura principal do conteúdo. ${COPYWRITERS[secondaryId]?.name ?? secondaryId} reforça os pontos críticos de persuasão.`
  );
}

// ─── Detecção de nicho ────────────────────────────────────────────────────────

type NicheCategory =
  | 'construcao'
  | 'saude'
  | 'educacao'
  | 'varejo'
  | 'servicos-locais'
  | 'default';

function detectNiche(niche: string): NicheCategory {
  const n = niche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/constru|material|tinta|ferragen|madeira|reform/.test(n)) return 'construcao';
  if (/saude|saúde|bem.estar|nutri|fitness|medic|clinic|farmac|estetica|beleza/.test(n))
    return 'saude';
  if (/educa|infoproduto|curso|coach|mentor|treinamento/.test(n)) return 'educacao';
  if (/varejo|moda|roupa|loja|fashion|vestuario|calcado/.test(n)) return 'varejo';
  if (/servico|servico local|advocac|contabil|imobil|restaurante|salao|barbearia|pet/.test(n))
    return 'servicos-locais';

  return 'default';
}

// ─── Seleção principal ────────────────────────────────────────────────────────

export function selectCopywriters(
  contentType: ContentType,
  niche: string
): CopywriterPair {
  const nicheCategory = detectNiche(niche);

  switch (contentType) {
    case 'reels-valor':
      return selectReelsValor(nicheCategory);

    case 'reels-institucional':
      return selectReelsInstitucional(nicheCategory);

    case 'anuncio':
      return selectAnuncio(nicheCategory);

    case 'peca-estatica':
      return selectPecaEstatica(nicheCategory);

    case 'carrossel':
      return selectCarrossel(nicheCategory);
  }
}

// ─── Seleção por tipo de conteúdo ─────────────────────────────────────────────

function selectReelsValor(niche: NicheCategory): CopywriterPair {
  if (niche === 'saude') {
    return makePair(
      'robert-collier',
      'eugene-schwartz',
      'Especialista em conexão empática, cria a cena mental que prende o espectador no gancho e gera identificação imediata.',
      'Calibra a mensagem ao nível de consciência do mercado de saúde, evitando promessas que o público já ouviu mil vezes.',
    );
  }

  if (niche === 'varejo') {
    return makePair(
      'gary-halbert',
      'robert-collier',
      'Lidera com storytelling emocional bruto e a lógica da multidão faminta — encontra quem já quer comprar.',
      'Complementa com empatia profunda e a cena mental que transforma um produto comum em objeto de desejo.',
    );
  }

  if (niche === 'servicos-locais') {
    return makePair(
      'gary-halbert',
      'john-carlton',
      'Traz a emoção de rua e o storytelling visceral que conecta com o público local de forma autêntica.',
      'Encontra o ângulo de venda oculto específico para serviços locais, com poder de entretenimento que mantém o espectador até o CTA.',
    );
  }

  if (niche === 'construcao') {
    return makePair(
      'gary-halbert',
      'john-carlton',
      'Usa storytelling emocional e a lógica da multidão faminta para alcançar quem já precisa do produto.',
      'Encontra o ângulo de venda mais direto e impactante para um nicho técnico e pragmático.',
    );
  }

  // default (inclui educação/infoproduto)
  return makePair(
    'gary-halbert',
    'frank-kern',
    'Lidera com storytelling emocional bruto e street-smart marketing. Encontra a multidão faminta e a agarra pelo pescoço.',
    'Reforça a autenticidade e aplica Results In Advance — entrega valor real antes de pedir qualquer ação.',
  );
}

function selectReelsInstitucional(niche: NicheCategory): CopywriterPair {
  if (niche === 'varejo') {
    return makePair(
      'david-ogilvy',
      'robert-collier',
      'Define o brand image premium e a big idea que posiciona a marca acima da concorrência.',
      'Constrói a conexão emocional e a narrativa que faz o espectador se identificar com os valores da marca.',
    );
  }

  if (niche === 'educacao') {
    return makePair(
      'david-ogilvy',
      'russell-brunson',
      'Estabelece a credibilidade e o brand image que diferencia no mercado educacional saturado.',
      'Estrutura a epiphany bridge que transforma o espectador em seguidor e depois em comprador.',
    );
  }

  // default
  return makePair(
    'david-ogilvy',
    'russell-brunson',
    'Define o brand image e a big idea que posiciona o cliente como autoridade no nicho.',
    'Estrutura o hook e a epiphany bridge que cria conexão emocional com a marca.',
  );
}

function selectAnuncio(niche: NicheCategory): CopywriterPair {
  if (niche === 'saude') {
    return makePair(
      'clayton-makepeace',
      'gary-bencivenga',
      'Identifica e amplifica a Dominant Resident Emotion do público — a emoção que já pulsa dentro do avatar antes do anúncio.',
      'Constrói a equação de persuasão com prova científica e credibilidade irrefutável, essencial no nicho de saúde.',
    );
  }

  if (niche === 'educacao') {
    return makePair(
      'clayton-makepeace',
      'gary-bencivenga',
      'Usa o Four-Legged Stool para construir uma oferta de alto ticket emocionalmente irresistível.',
      'Adiciona a camada de prova e credibilidade que converte céticos em compradores de infoprodutos.',
    );
  }

  if (niche === 'construcao' || niche === 'servicos-locais') {
    return makePair(
      'dan-kennedy',
      'gary-bencivenga',
      'Constrói a oferta irresistível com PAS e urgência real — especialista em nichos pragmáticos como construção e serviços.',
      'Adiciona as camadas de prova após cada claim, transformando promessas em fatos verificáveis.',
    );
  }

  if (niche === 'varejo') {
    return makePair(
      'dan-kennedy',
      'gary-bencivenga',
      'Estrutura a oferta de varejo com urgência e especificidade que força a decisão imediata.',
      'Adiciona prova social e credibilidade para superar a resistência do consumidor digital.',
    );
  }

  // default
  return makePair(
    'dan-kennedy',
    'gary-bencivenga',
    'Constrói a oferta e urgência com PAS — direto, sem firulas, focado no resultado.',
    'Adiciona as camadas de prova após cada claim, transformando um bom anúncio em um anúncio invencível.',
  );
}

function selectPecaEstatica(niche: NicheCategory): CopywriterPair {
  if (niche === 'construcao') {
    return makePair(
      'claude-hopkins',
      'dan-kennedy',
      'Constrói claims ultra-específicos com reason-why — cada benefício apoiado por um fato concreto.',
      'Transforma esses claims em uma oferta direta e urgente para um público pragmático que quer números, não poesia.',
    );
  }

  // default
  return makePair(
    'claude-hopkins',
    'david-deutsch',
    'Define os claims específicos e o reason-why — cada palavra deve ser verificável e relevante.',
    'Encontra a big idea que unifica headline, suporte e CTA em um conceito memorável e único.',
  );
}

function selectCarrossel(niche: NicheCategory): CopywriterPair {
  if (niche === 'educacao') {
    return makePair(
      'joe-sugarman',
      'david-deutsch',
      'Garante que cada slide puxa o leitor para o próximo — o slippery slide que transforma um carrossel em obsessão.',
      'Encontra a big idea que dá ao carrossel educacional um ângulo irresistível e um conceito que fica na cabeça.',
    );
  }

  // default
  return makePair(
    'joe-sugarman',
    'parris-lampropoulos',
    'Garante o slippery slide entre slides — cada card conclui com um gancho que força o próximo swipe.',
    'Escreve os bullets e hooks de cada slide com fascination bullets que fazem o leitor salvar e compartilhar.',
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function makePair(
  primaryId: string,
  secondaryId: string,
  whyPrimary: string,
  whySecondary: string,
): CopywriterPair {
  const primary = COPYWRITERS[primaryId];
  const secondary = COPYWRITERS[secondaryId];

  if (!primary || !secondary) {
    throw new Error(`Copywriter não encontrado: ${primaryId} ou ${secondaryId}`);
  }

  return {
    primary,
    secondary,
    combinationInstruction: getCombinationInstruction(primaryId, secondaryId),
    whyPrimary,
    whySecondary,
  };
}
