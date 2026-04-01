'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ContentRow {
  id: number;
  contentType: string;
  title: string;
  framework: string;
  filePath: string;
  createdAt: Date;
  status: string;
}

interface HistoricoClientProps {
  clientName: string;
  slug: string;
  contents: ContentRow[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'reels-valor': 'Reels de Valor',
  'reels-institucional': 'Reels Institucional',
  anuncio: 'Anúncio',
  'peca-estatica': 'Peça Estática',
  carrossel: 'Carrossel',
};

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todo o período' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 3 meses' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HistoricoClient({ clientName, slug, contents }: HistoricoClientProps) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [modalId, setModalId] = useState<number | null>(null);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // ── Filtragem ──────────────────────────────────────────────────────────────

  const cutoffDate =
    periodFilter === 'all'
      ? null
      : new Date(Date.now() - parseInt(periodFilter) * 86_400_000);

  const filtered = contents.filter((c) => {
    if (typeFilter !== 'all' && c.contentType !== typeFilter) return false;
    if (cutoffDate && new Date(c.createdAt) < cutoffDate) return false;
    return true;
  });

  // ── Abrir modal ────────────────────────────────────────────────────────────

  async function openModal(row: ContentRow) {
    setModalId(row.id);
    setModalTitle(row.title);
    setModalContent(null);
    setModalLoading(true);

    try {
      const res = await fetch(`/api/content/${row.id}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { content: string };
      setModalContent(data.content);
    } catch {
      setModalContent('⚠️ Não foi possível carregar o arquivo.');
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setModalId(null);
    setModalContent(null);
    setModalTitle('');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-8 py-5">
        <div className="mx-auto max-w-5xl flex items-center gap-4">
          <a
            href={`/dashboard/${slug}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
            Voltar ao chat
          </a>
          <span className="text-muted-foreground/30">|</span>
          <div>
            <p className="text-xs text-muted-foreground">Histórico de conteúdos</p>
            <p className="text-base font-semibold text-foreground">{clientName}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos os tipos</option>
            {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <p className="ml-auto text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'conteúdo' : 'conteúdos'}
          </p>
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
            <p className="text-sm">Nenhum conteúdo encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Título
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Framework
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openModal(row)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.title}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {CONTENT_TYPE_LABELS[row.contentType] ?? row.contentType}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.framework}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="text-sm font-semibold text-foreground">{modalTitle}</p>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {modalLoading ? (
                <div className="flex justify-center py-10">
                  <span className="text-sm text-muted-foreground">Carregando…</span>
                </div>
              ) : (
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
                  {modalContent ?? ''}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
