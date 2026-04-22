'use client';

import { useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Idea {
  title: string;
  angle: string;
  hook: string;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseIdeasFromText(
  text: string
): { ideas: Idea[]; preamble: string } | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as Record<string, unknown>).ideas)
    ) {
      return null;
    }
    const ideas = (parsed as { ideas: Idea[] }).ideas;
    const preamble = text.slice(0, match.index ?? 0).trim();
    return { ideas, preamble };
  } catch {
    return null;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface IdeaApprovalProps {
  preamble: string;
  ideas: Idea[];
  onConfirm: (ideas: Idea[]) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

export default function IdeaApproval({
  preamble,
  ideas,
  onConfirm,
  onRefresh,
  disabled = false,
}: IdeaApprovalProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const count = selected.size;
  const selectedIdeas = ideas.filter((_, i) => selected.has(i));

  return (
    <div className="space-y-4">
      {preamble && (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {preamble}
        </p>
      )}

      <p className="text-sm font-medium text-foreground">
        Selecione as ideias que quer desenvolver:
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {ideas.map((idea, i) => {
          const isSelected = selected.has(i);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => toggle(i)}
              className={`group flex flex-col gap-2 rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-card/80 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-sm font-semibold transition-colors ${
                    isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                  }`}
                >
                  {idea.title}
                </p>
                {/* Checkbox visual */}
                <div
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-2.5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {idea.angle}
              </p>
              {idea.hook && (
                <p className="mt-1 border-l-2 border-border pl-2 text-xs italic text-muted-foreground/70">
                  &ldquo;{idea.hook}&rdquo;
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          disabled={disabled || count === 0}
          onClick={() => onConfirm(selectedIdeas)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {count === 0
            ? 'Selecione uma ideia'
            : count === 1
            ? 'Gerar 1 roteiro'
            : `Gerar ${count} roteiros`}
        </button>

        <button
          disabled={disabled}
          onClick={onRefresh}
          className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gerar novas ideias
        </button>
      </div>
    </div>
  );
}
