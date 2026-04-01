'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ClientCardData {
  slug: string;
  name: string;
  niche: string;
  lastContentAt: string | null;
}

function formatLastContent(isoDate: string | null): string {
  if (!isoDate) return 'Nenhum conteúdo ainda';
  const days = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 86_400_000
  );
  if (days === 0) return 'Último conteúdo: hoje';
  if (days === 1) return 'Último conteúdo: ontem';
  return `Último conteúdo: ${days} dias atrás`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function ClientSelectorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-11 w-full rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-xl border border-border bg-card animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ClientSelector({
  clients,
}: {
  clients: ClientCardData[];
}) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filtered =
    search.trim() === ''
      ? clients
      : clients.filter((c) =>
          c.name.toLowerCase().includes(search.trim().toLowerCase())
        );

  return (
    <div className="space-y-6">
      {/* Barra de busca */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Contador */}
      <p className="text-sm text-muted-foreground">
        {filtered.length === 0
          ? 'Nenhum cliente encontrado'
          : `${filtered.length} ${filtered.length === 1 ? 'cliente' : 'clientes'}`}
      </p>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-3 size-8 opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
          <span className="text-sm">Nenhum cliente encontrado para &ldquo;{search}&rdquo;</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <button
              key={client.slug}
              onClick={() => router.push(`/dashboard/${client.slug}`)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 text-left transition-all duration-150 hover:border-primary/40 hover:bg-card/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Niche badge */}
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {client.niche || 'Sem nicho'}
              </span>

              {/* Nome */}
              <p className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                {client.name}
              </p>

              {/* Último conteúdo */}
              <p className="mt-auto text-xs text-muted-foreground">
                {formatLastContent(client.lastContentAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
