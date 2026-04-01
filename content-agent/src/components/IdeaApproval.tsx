'use client';

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
  onSelect: (idea: Idea) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

export default function IdeaApproval({
  preamble,
  ideas,
  onSelect,
  onRefresh,
  disabled = false,
}: IdeaApprovalProps) {
  return (
    <div className="space-y-4">
      {preamble && (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {preamble}
        </p>
      )}

      <p className="text-sm font-medium text-foreground">
        Escolha uma ideia para desenvolver:
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {ideas.map((idea, i) => (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onSelect(idea)}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {idea.title}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {idea.angle}
            </p>
            {idea.hook && (
              <p className="mt-1 border-l-2 border-border pl-2 text-xs italic text-muted-foreground/70">
                &ldquo;{idea.hook}&rdquo;
              </p>
            )}
          </button>
        ))}
      </div>

      <button
        disabled={disabled}
        onClick={onRefresh}
        className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        Gerar novas ideias
      </button>
    </div>
  );
}
