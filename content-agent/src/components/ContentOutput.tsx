'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ContentType =
  | 'reels-valor'
  | 'reels-institucional'
  | 'anuncio'
  | 'peca-estatica'
  | 'carrossel';

interface ContentOutputProps {
  content: string;
  contentType: ContentType;
  framework: string;
  ideaTitle: string;
  clientSlug: string;
  onNewVersion: () => void;
  onSaved: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  'reels-valor': 'Reels de Valor',
  'reels-institucional': 'Reels Institucional',
  anuncio: 'Anúncio',
  'peca-estatica': 'Peça Estática',
  carrossel: 'Carrossel',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ContentOutput({
  content,
  contentType,
  framework,
  ideaTitle,
  clientSlug,
  onNewVersion,
  onSaved,
}: ContentOutputProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug,
          contentType,
          title: ideaTitle,
          framework,
          body: content,
        }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setSaveStatus('saved');
      onSaved();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-5 py-3">
        <span className="rounded-md bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {CONTENT_TYPE_LABELS[contentType]}
        </span>
        <span className="text-xs text-muted-foreground">{framework}</span>
        <span className="text-xs text-muted-foreground/40">•</span>
        <span className="text-xs text-muted-foreground">{today}</span>
      </div>

      {/* ── Conteúdo em markdown ── */}
      <div className="px-6 py-5">
        <p className="mb-4 text-sm font-semibold text-foreground">{ideaTitle}</p>
        <div className="space-y-0">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mt-5 mb-2 text-base font-bold text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-5 mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/70">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-4 mb-1 text-sm font-semibold text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 text-sm leading-relaxed text-foreground">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 list-disc list-inside space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 list-decimal list-inside space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-sm leading-relaxed text-foreground">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
              hr: () => <hr className="my-4 border-border" />,
              blockquote: ({ children }) => (
                <blockquote className="my-3 border-l-2 border-primary pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* ── Ações ── */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
        {/* Aprovar e Salvar */}
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {saveStatus === 'saving'
            ? 'Salvando…'
            : saveStatus === 'saved'
            ? '✓ Salvo'
            : saveStatus === 'error'
            ? '⚠ Tentar novamente'
            : 'Aprovar e Salvar'}
        </button>

        {/* Pedir nova versão */}
        <button
          onClick={onNewVersion}
          disabled={saveStatus === 'saving'}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Pedir nova versão
        </button>

        {/* Copiar */}
        <button
          onClick={handleCopy}
          className="ml-auto rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
