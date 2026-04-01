'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import IdeaApproval, { parseIdeasFromText, type Idea } from './IdeaApproval';
import ContentOutput from './ContentOutput';
import { COPYWRITERS, COPYWRITERS_LIST, type ContentType } from '@/lib/copywriters/index';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ChatStage = 'type-selection' | 'ideas' | 'info-gathering' | 'generation' | 'revision';
type ApiStage = Exclude<ChatStage, 'type-selection'>;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ActivePair {
  primary: { id: string; name: string; icon: string; title: string };
  secondary: { id: string; name: string; icon: string; title: string };
  combinationInstruction: string;
  whyPrimary: string;
  whySecondary: string;
}

interface AgentBody {
  clientSlug: string;
  clientNiche: string;
  contentType: ContentType;
  stage: ApiStage;
  ideaTitle: string;
  primaryCopywriterId?: string;
  secondaryCopywriterId?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'reels-valor', label: 'Reels de Valor' },
  { value: 'reels-institucional', label: 'Reels Institucional' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'peca-estatica', label: 'Peça Estática' },
  { value: 'carrossel', label: 'Carrossel' },
];

const CONTENT_TYPE_FRAMEWORKS: Record<ContentType, string> = {
  'reels-valor': 'Gancho / Corpo / CTA',
  'reels-institucional': 'StoryBrand',
  anuncio: 'PAS',
  'peca-estatica': 'Headline + Suporte + CTA',
  carrossel: 'Gancho / Valor / CTA',
};

const STAGE_LABELS: Record<ChatStage, string> = {
  'type-selection': 'Seleção',
  ideas: 'Ideias',
  'info-gathering': 'Detalhes',
  generation: 'Geração',
  revision: 'Revisão',
};

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  'reels-valor': 'Reels de Valor',
  'reels-institucional': 'Reels Institucional',
  anuncio: 'Anúncio',
  'peca-estatica': 'Peça Estática',
  carrossel: 'Carrossel',
};

const INITIAL_CONTENT =
  'Olá! Sou o agente de conteúdo da M|P Assessoria. Para começar, que tipo de conteúdo você quer criar hoje?';

let msgSeq = 0;
function nextId() {
  return `msg-${Date.now()}-${++msgSeq}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgentChatProps {
  clientSlug: string;
  clientName: string;
  clientNiche: string;
  contentCount: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AgentChat({
  clientSlug,
  clientName,
  clientNiche,
  contentCount,
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init-0', role: 'assistant', content: INITIAL_CONTENT },
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'ready' | 'streaming'>('ready');
  const [stage, setStage] = useState<ChatStage>('type-selection');
  const [contentType, setContentType] = useState<ContentType>('reels-valor');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [displayCount, setDisplayCount] = useState(contentCount);

  // Copywriter pair state
  const [activePair, setActivePair] = useState<ActivePair | null>(null);
  const [showPairPopover, setShowPairPopover] = useState(false);
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [selectorPrimary, setSelectorPrimary] = useState<string | null>(null);
  const [selectorSecondary, setSelectorSecondary] = useState<string | null>(null);
  const [selectorFilter, setSelectorFilter] = useState<ContentType | 'all'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-scroll quando chegam novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Auto-resize do textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!showPairPopover) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPairPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPairPopover]);

  // ─── Streaming call ─────────────────────────────────────────────────────────

  const streamMessage = useCallback(
    async (userContent: string, body: AgentBody, prevMessages: ChatMessage[]) => {
      const userMsg: ChatMessage = { id: nextId(), role: 'user', content: userContent };
      const assistantId = nextId();
      const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' };

      const snapshot = [...prevMessages, userMsg];
      setMessages([...snapshot, assistantMsg]);
      setStatus('streaming');

      const apiMessages = snapshot.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, messages: apiMessages }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Erro ${res.status}: ${await res.text()}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `⚠️ ${msg}` } : m
          )
        );
      } finally {
        setStatus('ready');
      }
    },
    []
  );

  // ─── Handlers de transição de stage ────────────────────────────────────────

  async function handleSelectContentType(type: ContentType) {
    const label = CONTENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
    setContentType(type);
    setStage('ideas');

    // Busca o par de copywriters para este tipo de conteúdo
    let pair: ActivePair | null = null;
    try {
      const res = await fetch(
        `/api/copywriters?contentType=${type}&niche=${encodeURIComponent(clientNiche)}`
      );
      if (res.ok) {
        pair = (await res.json()) as ActivePair;
        setActivePair(pair);
        setSelectorPrimary(pair.primary.id);
        setSelectorSecondary(pair.secondary.id);
      }
    } catch {
      // Continua sem copywriters se houver erro
    }

    streamMessage(
      `Quero criar: ${label}`,
      {
        clientSlug,
        clientNiche,
        contentType: type,
        stage: 'ideas',
        ideaTitle: '',
        primaryCopywriterId: pair?.primary.id,
        secondaryCopywriterId: pair?.secondary.id,
      },
      messages
    );
  }

  function handleSelectIdea(idea: Idea) {
    setIdeaTitle(idea.title);
    setStage('info-gathering');
    streamMessage(
      `Escolhi a ideia: **${idea.title}**`,
      {
        clientSlug,
        clientNiche,
        contentType,
        stage: 'info-gathering',
        ideaTitle: idea.title,
        primaryCopywriterId: activePair?.primary.id,
        secondaryCopywriterId: activePair?.secondary.id,
      },
      messages
    );
  }

  function handleRefreshIdeas() {
    streamMessage(
      'Por favor, gere novas ideias diferentes das anteriores.',
      {
        clientSlug,
        clientNiche,
        contentType,
        stage: 'ideas',
        ideaTitle: '',
        primaryCopywriterId: activePair?.primary.id,
        secondaryCopywriterId: activePair?.secondary.id,
      },
      messages
    );
  }

  function handleNewVersion() {
    setStage('revision');
  }

  function handleContentSaved() {
    setDisplayCount((c) => c + 1);
  }

  // ─── Submit manual ──────────────────────────────────────────────────────────

  function submitMessage() {
    const text = input.trim();
    if (!text || status === 'streaming') return;

    const apiStage: ApiStage = stage === 'type-selection' ? 'ideas' : stage;
    setInput('');
    streamMessage(
      text,
      {
        clientSlug,
        clientNiche,
        contentType,
        stage: apiStage,
        ideaTitle,
        primaryCopywriterId: activePair?.primary.id,
        secondaryCopywriterId: activePair?.secondary.id,
      },
      messages
    );

    if (stage === 'revision') {
      setStage('generation');
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitMessage();
  }

  // ─── Pair selector manual ───────────────────────────────────────────────────

  function handleConfirmManualPair() {
    if (!selectorPrimary || !selectorSecondary) return;
    const p = COPYWRITERS[selectorPrimary];
    const s = COPYWRITERS[selectorSecondary];
    if (!p || !s) return;

    setActivePair({
      primary: { id: p.id, name: p.name, icon: p.icon, title: p.title },
      secondary: { id: s.id, name: s.name, icon: s.icon, title: s.title },
      combinationInstruction: `${p.name} lidera a estrutura principal do conteúdo. ${s.name} reforça os pontos críticos de persuasão.`,
      whyPrimary: 'Selecionado manualmente.',
      whySecondary: 'Selecionado manualmente.',
    });
    setShowPairSelector(false);
    setShowPairPopover(false);
  }

  // ─── Filtro do seletor manual ─────────────────────────────────────────────

  const filteredCopywriters =
    selectorFilter === 'all'
      ? COPYWRITERS_LIST
      : COPYWRITERS_LIST.filter((c) => c.bestFor.includes(selectorFilter));

  // ─── Derivações de UI ────────────────────────────────────────────────────────

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  const ideasData =
    stage === 'ideas' && status === 'ready' && lastAssistantMsg
      ? parseIdeasFromText(lastAssistantMsg.content)
      : null;

  const showContentOutput =
    (stage === 'generation' || stage === 'revision') &&
    status === 'ready' &&
    lastAssistantMsg !== undefined &&
    lastAssistantMsg.content.length > 100;

  const inputDisabled =
    status === 'streaming' ||
    stage === 'type-selection' ||
    (stage === 'generation' && showContentOutput);

  const inputPlaceholder =
    stage === 'type-selection'
      ? 'Selecione o tipo de conteúdo acima...'
      : stage === 'revision'
      ? 'Descreva o que precisa mudar...'
      : 'Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card px-5 py-8">
        <a
          href="/dashboard"
          className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Todos os clientes
        </a>

        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Cliente
          </p>
          <p className="text-lg font-bold leading-snug text-foreground">{clientName}</p>
        </div>

        {clientNiche && (
          <span className="mt-2 w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {clientNiche}
          </span>
        )}

        <div className="mt-5 rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Conteúdos gerados</p>
          <p className="text-2xl font-bold text-foreground">{displayCount}</p>
        </div>

        {/* Link para histórico */}
        <a
          href={`/dashboard/${clientSlug}/historico`}
          className="mt-3 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
            />
          </svg>
          Ver histórico
        </a>

        {stage !== 'type-selection' && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Sessão atual
            </p>
            <div className="space-y-1.5 text-xs">
              <p className="text-muted-foreground">
                <span className="text-foreground/50">Tipo: </span>
                {CONTENT_TYPE_OPTIONS.find((o) => o.value === contentType)?.label}
              </p>
              {ideaTitle && (
                <p className="text-muted-foreground">
                  <span className="text-foreground/50">Ideia: </span>
                  {ideaTitle}
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="text-foreground/50">Etapa: </span>
                {STAGE_LABELS[stage]}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ── Área de chat ── */}
      <main className="flex flex-1 flex-col overflow-hidden">

        {/* ── Badge de copywriters ── */}
        {activePair && (
          <div className="relative border-b border-border bg-card/50">
            <button
              onClick={() => setShowPairPopover((v) => !v)}
              className="w-full px-6 py-2.5 text-left transition-colors hover:bg-muted/40"
            >
              <div className="mx-auto flex max-w-2xl items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {activePair.primary.icon} {activePair.primary.name}
                    <span className="mx-2 text-muted-foreground/40">+</span>
                    {activePair.secondary.icon} {activePair.secondary.name}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{CONTENT_TYPE_LABEL[contentType]}</span>
                    {clientNiche && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span>{clientName}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>{clientNiche}</span>
                      </>
                    )}
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`size-3.5 text-muted-foreground transition-transform ${showPairPopover ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>

            {/* Popover */}
            {showPairPopover && (
              <div
                ref={popoverRef}
                className="absolute left-1/2 top-full z-40 mt-1 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              >
                <div className="grid grid-cols-2 gap-0 divide-x divide-border">
                  {/* Primário */}
                  <div className="p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      Primário
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {activePair.primary.icon} {activePair.primary.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{activePair.primary.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                      {activePair.whyPrimary}
                    </p>
                  </div>
                  {/* Secundário */}
                  <div className="p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Secundário
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {activePair.secondary.icon} {activePair.secondary.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {activePair.secondary.title}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                      {activePair.whySecondary}
                    </p>
                  </div>
                </div>
                {/* Instrução de combinação */}
                <div className="border-t border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Combinação: </span>
                    {activePair.combinationInstruction}
                  </p>
                </div>
                {/* Botão trocar */}
                <div className="border-t border-border px-4 py-3">
                  <button
                    onClick={() => {
                      setSelectorPrimary(activePair.primary.id);
                      setSelectorSecondary(activePair.secondary.id);
                      setSelectorFilter('all');
                      setShowPairSelector(true);
                      setShowPairPopover(false);
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Trocar copywriters →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.map((message, idx) => {
              const isLast = idx === messages.length - 1;
              const isAssistant = message.role === 'assistant';

              // Último assistente em stage 'ideas' com JSON → renderiza IdeaApproval
              if (isAssistant && isLast && ideasData) {
                return (
                  <div key={message.id}>
                    <IdeaApproval
                      preamble={ideasData.preamble}
                      ideas={ideasData.ideas}
                      onSelect={handleSelectIdea}
                      onRefresh={handleRefreshIdeas}
                      disabled={status === 'streaming'}
                    />
                  </div>
                );
              }

              // Último assistente em stage 'generation'/'revision' com conteúdo → renderiza ContentOutput
              if (isAssistant && isLast && showContentOutput) {
                return (
                  <div key={message.id}>
                    <ContentOutput
                      content={message.content}
                      contentType={contentType}
                      framework={CONTENT_TYPE_FRAMEWORKS[contentType]}
                      ideaTitle={ideaTitle}
                      clientSlug={clientSlug}
                      onNewVersion={handleNewVersion}
                      onSaved={handleContentSaved}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isAssistant
                        ? 'rounded-tl-sm border border-border bg-card text-foreground'
                        : 'rounded-tr-sm bg-primary text-primary-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {/* Indicador de digitação (antes do primeiro chunk chegar) */}
            {status === 'streaming' &&
              messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Botões de seleção de tipo de conteúdo */}
            {stage === 'type-selection' && status === 'ready' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {CONTENT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelectContentType(option.value)}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background px-6 py-4">
          <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={inputDisabled}
              placeholder={inputPlaceholder}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
              className="max-h-40 flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={inputDisabled || !input.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        </div>
      </main>

      {/* ── Modal: Seletor manual de copywriters ── */}
      {showPairSelector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowPairSelector(false)}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Selecionar copywriters</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Clique uma vez para primário (
                  <span className="text-primary">azul</span>), duas para secundário (
                  <span className="text-muted-foreground">cinza</span>)
                </p>
              </div>
              <button
                onClick={() => setShowPairSelector(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filtro por tipo */}
            <div className="flex gap-2 overflow-x-auto border-b border-border px-6 py-3">
              {([['all', 'Todos'] as const, ...CONTENT_TYPE_OPTIONS.map((o) => [o.value, o.label] as const)]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setSelectorFilter(value as ContentType | 'all')}
                    className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      selectorFilter === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            {/* Grade de copywriters */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredCopywriters.map((cw) => {
                  const isPrimary = selectorPrimary === cw.id;
                  const isSecondary = selectorSecondary === cw.id;

                  function handleCardClick() {
                    if (isPrimary) {
                      // Já é primário → vira secundário
                      setSelectorSecondary(cw.id);
                      if (selectorSecondary === cw.id) setSelectorPrimary(null);
                    } else if (isSecondary) {
                      // Já é secundário → desseleciona
                      setSelectorSecondary(null);
                    } else {
                      // Não selecionado → vira primário (se não tem primário) ou secundário
                      if (!selectorPrimary) {
                        setSelectorPrimary(cw.id);
                      } else if (!selectorSecondary) {
                        setSelectorSecondary(cw.id);
                      } else {
                        // Substitui o primário
                        setSelectorPrimary(cw.id);
                      }
                    }
                  }

                  return (
                    <button
                      key={cw.id}
                      onClick={handleCardClick}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        isPrimary
                          ? 'border-primary bg-primary/10'
                          : isSecondary
                          ? 'border-border bg-muted/50'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cw.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {cw.name}
                          </p>
                          <p className={`text-[10px] font-medium ${
                            isPrimary ? 'text-primary' : isSecondary ? 'text-muted-foreground' : 'opacity-0'
                          }`}>
                            {isPrimary ? 'Primário' : isSecondary ? 'Secundário' : 'x'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                        {cw.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="text-xs text-muted-foreground">
                {selectorPrimary && (
                  <span>
                    {COPYWRITERS[selectorPrimary]?.icon} <strong>{COPYWRITERS[selectorPrimary]?.name}</strong>
                    {selectorSecondary && (
                      <>
                        {' + '}
                        {COPYWRITERS[selectorSecondary]?.icon} <strong>{COPYWRITERS[selectorSecondary]?.name}</strong>
                      </>
                    )}
                  </span>
                )}
                {!selectorPrimary && 'Nenhum selecionado'}
              </div>
              <button
                onClick={handleConfirmManualPair}
                disabled={!selectorPrimary || !selectorSecondary}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar par
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
