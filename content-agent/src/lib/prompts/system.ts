// ─── Injeção de copywriters no system prompt ──────────────────────────────────

interface CopywriterBlock {
  primaryName: string;
  primaryRole: string;
  primaryContext: string;
  secondaryName: string;
  secondaryRole: string;
  secondaryContext: string;
  combinationInstruction: string;
}

/**
 * Gera o bloco de copywriters para injeção no system prompt.
 * Deve ser inserido logo após a instrução de idioma e antes
 * das seções específicas do tipo de conteúdo.
 */
export function buildCopywriterBlock({
  primaryName,
  primaryRole,
  primaryContext,
  secondaryName,
  secondaryRole,
  secondaryContext,
  combinationInstruction,
}: CopywriterBlock): string {
  return `---

## MESTRES DO COPYWRITING ATIVOS

Você está gerando este conteúdo combinando a perspectiva de dois mestres do copywriting:

**COPYWRITER PRIMÁRIO — ${primaryName} (${primaryRole}):**

${primaryContext}

---

**COPYWRITER SECUNDÁRIO — ${secondaryName} (${secondaryRole}):**

${secondaryContext}

---

**INSTRUÇÃO DE COMBINAÇÃO:**
${combinationInstruction}

Aplique o framework do copywriter primário como estrutura principal.
Use o copywriter secundário para reforçar pontos específicos conforme a instrução acima.

---`;
}
