// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ContentType =
  | 'reels-valor'
  | 'reels-institucional'
  | 'anuncio'
  | 'peca-estatica'
  | 'carrossel';

export interface CopywriterInfo {
  id: string;
  name: string;
  icon: string;
  title: string;
  tier: '1a' | '1b' | '1c' | '1d';
  strengths: string[];
  bestFor: ContentType[];
}

// ─── Registro dos 20 copywriters ─────────────────────────────────────────────

export const COPYWRITERS: Record<string, CopywriterInfo> = {
  'gary-halbert': {
    id: 'gary-halbert',
    name: 'Gary Halbert',
    icon: '🔥',
    title: 'The Prince of Print — Raw Emotional Storytelling',
    tier: '1a',
    strengths: ['storytelling', 'direct-response', 'emotional-copy', 'sales-letters'],
    bestFor: ['reels-valor', 'anuncio'],
  },
  'frank-kern': {
    id: 'frank-kern',
    name: 'Frank Kern',
    icon: '🏄',
    title: 'Intent-Based Branding Pioneer — Results In Advance',
    tier: '1b',
    strengths: ['authenticity', 'results-in-advance', 'launch', 'goodwill'],
    bestFor: ['reels-valor', 'reels-institucional'],
  },
  'dan-kennedy': {
    id: 'dan-kennedy',
    name: 'Dan Kennedy',
    icon: '🎯',
    title: 'Professor of Harsh Reality — No B.S. Direct Response',
    tier: '1b',
    strengths: ['PAS', 'direct-response', 'offer-creation', 'urgency', 'local-marketing'],
    bestFor: ['anuncio', 'peca-estatica'],
  },
  'david-ogilvy': {
    id: 'david-ogilvy',
    name: 'David Ogilvy',
    icon: '🎩',
    title: 'Father of Modern Advertising',
    tier: '1d',
    strengths: ['brand-image', 'big-idea', 'research', 'headlines'],
    bestFor: ['reels-institucional', 'anuncio', 'peca-estatica'],
  },
  'russell-brunson': {
    id: 'russell-brunson',
    name: 'Russell Brunson',
    icon: '🔻',
    title: 'Funnel Architect — Value Ladders & Epiphany Bridges',
    tier: '1b',
    strengths: ['funnel', 'epiphany-bridge', 'hook-story-offer', 'infoproduct'],
    bestFor: ['reels-institucional', 'carrossel'],
  },
  'gary-bencivenga': {
    id: 'gary-bencivenga',
    name: 'Gary Bencivenga',
    icon: '👑',
    title: "World's Greatest Living Copywriter — Master of Proof",
    tier: '1a',
    strengths: ['proof', 'persuasion-equation', 'credibility', 'sophisticated-audiences'],
    bestFor: ['anuncio', 'carrossel'],
  },
  'claude-hopkins': {
    id: 'claude-hopkins',
    name: 'Claude Hopkins',
    icon: '🔬',
    title: 'Father of Scientific Advertising',
    tier: '1a',
    strengths: ['specificity', 'reason-why', 'scientific', 'claims'],
    bestFor: ['peca-estatica', 'anuncio'],
  },
  'david-deutsch': {
    id: 'david-deutsch',
    name: 'David Deutsch',
    icon: '🧩',
    title: 'CopyTHINKING Expert — Big Ideas & Fascination Master',
    tier: '1d',
    strengths: ['big-idea', 'fascination-bullets', 'thinking', 'concept'],
    bestFor: ['peca-estatica', 'carrossel'],
  },
  'joe-sugarman': {
    id: 'joe-sugarman',
    name: 'Joe Sugarman',
    icon: '🕶️',
    title: 'Slippery Slide Master — Psychological Triggers',
    tier: '1b',
    strengths: ['slippery-slide', 'psychological-triggers', 'flow', 'product-copy'],
    bestFor: ['carrossel', 'peca-estatica'],
  },
  'parris-lampropoulos': {
    id: 'parris-lampropoulos',
    name: 'Parris Lampropoulos',
    icon: '🎯',
    title: 'Best Copywriter You Never Heard Of — Fascination Master',
    tier: '1d',
    strengths: ['fascination-bullets', 'long-form', 'format', 'health-financial'],
    bestFor: ['carrossel', 'reels-valor'],
  },
  'eugene-schwartz': {
    id: 'eugene-schwartz',
    name: 'Eugene Schwartz',
    icon: '🧠',
    title: 'Master of Market Awareness & Strategic Copy',
    tier: '1a',
    strengths: ['market-awareness', 'strategic', 'headlines', 'awareness-levels'],
    bestFor: ['reels-valor', 'anuncio'],
  },
  'clayton-makepeace': {
    id: 'clayton-makepeace',
    name: 'Clayton Makepeace',
    icon: '💰',
    title: 'Highest-Paid Copywriter — Emotional Selling',
    tier: '1a',
    strengths: ['emotional-selling', 'health', 'finance', 'high-ticket'],
    bestFor: ['anuncio', 'reels-valor'],
  },
  'robert-collier': {
    id: 'robert-collier',
    name: 'Robert Collier',
    icon: '💌',
    title: 'Master of Empathy & the Mental Movie',
    tier: '1a',
    strengths: ['empathy', 'mental-movie', 'storytelling', 'emotional-connection'],
    bestFor: ['reels-valor', 'reels-institucional'],
  },
  'john-carlton': {
    id: 'john-carlton',
    name: 'John Carlton',
    icon: '🕵️',
    title: 'The Sales Detective — Most Ripped-Off Copywriter Alive',
    tier: '1a',
    strengths: ['selling-angle', 'direct-response', 'local-services', 'entertainment'],
    bestFor: ['anuncio', 'reels-valor'],
  },
  'jim-rutz': {
    id: 'jim-rutz',
    name: 'Jim Rutz',
    icon: '📰',
    title: 'Magalog Pioneer & Anti-Bore Crusader',
    tier: '1d',
    strengths: ['format', 'creativity', 'long-form', 'wit'],
    bestFor: ['carrossel', 'peca-estatica'],
  },
  'jon-benson': {
    id: 'jon-benson',
    name: 'Jon Benson',
    icon: '🎬',
    title: 'VSL Inventor — Billion Dollar Copywriter & NLP Master',
    tier: '1c',
    strengths: ['VSL', 'NLP', 'video-script', 'unique-mechanism'],
    bestFor: ['reels-valor', 'reels-institucional'],
  },
  'ben-settle': {
    id: 'ben-settle',
    name: 'Ben Settle',
    icon: '📧',
    title: 'Anti-Guru Email Maverick — Personality-First Copy',
    tier: '1c',
    strengths: ['email', 'personality', 'polarization', 'entertainment'],
    bestFor: ['reels-valor', 'carrossel'],
  },
  'andre-chaperon': {
    id: 'andre-chaperon',
    name: 'Andre Chaperon',
    icon: '✉️',
    title: 'Quiet Master of Email Storytelling & Soap Opera Sequence',
    tier: '1d',
    strengths: ['email', 'storytelling', 'soap-opera', 'intimate-trust'],
    bestFor: ['reels-valor', 'carrossel'],
  },
  'dan-koe': {
    id: 'dan-koe',
    name: 'Dan Koe',
    icon: '🧘',
    title: 'One-Person Business Philosopher — Deep Generalism',
    tier: '1d',
    strengths: ['short-form', 'personal-brand', 'philosophy', 'creator-economy'],
    bestFor: ['reels-valor', 'peca-estatica'],
  },
  'ry-schwartz': {
    id: 'ry-schwartz',
    name: 'Ry Schwartz',
    icon: '🎭',
    title: 'The Conversion Coach — Belief Transformation',
    tier: '1c',
    strengths: ['launch-email', 'belief-transformation', 'coaching', 'ethical'],
    bestFor: ['reels-institucional', 'carrossel'],
  },
};

// Lista ordenada para uso em grids/seletores
export const COPYWRITERS_LIST: CopywriterInfo[] = Object.values(COPYWRITERS);
