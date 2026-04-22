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

// ─── Utilitário: markdown → HTML para impressão ───────────────────────────────

function mdToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false;

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmt(text: string): string {
    return esc(text)
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  for (const line of lines) {
    const isList = /^[-*] /.test(line);
    if (inUl && !isList) { out.push('</ul>'); inUl = false; }

    if (/^### /.test(line))      out.push(`<h3>${fmt(line.slice(4))}</h3>`);
    else if (/^## /.test(line))  out.push(`<h2>${fmt(line.slice(3))}</h2>`);
    else if (/^# /.test(line))   out.push(`<h1>${fmt(line.slice(2))}</h1>`);
    else if (isList)             { if (!inUl) { out.push('<ul>'); inUl = true; } out.push(`<li>${fmt(line.slice(2))}</li>`); }
    else if (line.trim() === '---') out.push('<hr>');
    else if (/^> /.test(line))   out.push(`<blockquote>${fmt(line.slice(2))}</blockquote>`);
    else if (line.trim() === '')  { /* pula linhas vazias */ }
    else                          out.push(`<p>${fmt(line)}</p>`);
  }

  if (inUl) out.push('</ul>');
  return out.join('\n');
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

  function handleDownloadPdf() {
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${ideaTitle || 'Roteiro'}</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:20px 40px;color:#1a1a1a;line-height:1.75;font-size:15px}
  .header{margin-bottom:32px;border-bottom:2px solid #1a1a1a;padding-bottom:16px}
  .header h1{font-size:24px;margin:0 0 8px;font-weight:bold}
  .meta{font-size:12px;color:#888;font-family:sans-serif}
  h1{font-size:20px;font-weight:bold;margin:24px 0 6px}
  h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#666;margin:28px 0 8px;border-bottom:1px solid #e5e5e5;padding-bottom:4px}
  h3{font-size:15px;font-weight:bold;margin:20px 0 6px}
  p{margin:0 0 12px}
  ul{margin:0 0 12px;padding-left:24px}
  li{margin-bottom:4px}
  hr{border:none;border-top:1px solid #ddd;margin:24px 0}
  blockquote{border-left:3px solid #999;padding:2px 16px;color:#555;font-style:italic;margin:16px 0}
  strong{font-weight:700}
  code{font-family:monospace;background:#f4f4f4;padding:1px 4px;border-radius:3px}
  @media print{body{margin:0;padding:20px 40px}}
</style>
</head>
<body>
<div class="header">
  <h1>${ideaTitle || 'Roteiro'}</h1>
  <div class="meta">${CONTENT_TYPE_LABELS[contentType]} &nbsp;·&nbsp; ${framework} &nbsp;·&nbsp; ${today}</div>
</div>
${mdToHtml(content)}
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`);
    win.document.close();
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
        {/* Grupo esquerdo */}
        <div className="flex flex-wrap gap-3">
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

          <button
            onClick={onNewVersion}
            disabled={saveStatus === 'saving'}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pedir nova versão
          </button>
        </div>

        {/* Grupo direito */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>

          <button
            onClick={handleDownloadPdf}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
