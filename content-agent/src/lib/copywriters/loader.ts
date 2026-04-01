import fs from 'fs/promises';
import path from 'path';

// Limite aproximado: 3.000 tokens ≈ 12.000 caracteres
const MAX_CHARS_PER_COPYWRITER = 12_000;

// Seções do YAML a extrair (relevantes para geração de copy)
const KEEP_SECTIONS = ['core_frameworks', 'core_principles', 'writing_style'];

// Seções a descartar (biografia, obras, relações — economizam tokens)
const SKIP_SECTIONS = ['biography', 'famous_works', 'relationships', 'persona_profile', 'persona', 'agent'];

/**
 * Extrai uma seção de nível raiz de um bloco YAML (sem usar parser).
 * Uma seção começa quando a linha é `sectionName:` (sem indentação)
 * e termina na próxima linha sem indentação que começa com `[a-z_]+:`.
 */
function extractYamlSection(yaml: string, sectionName: string): string | null {
  const lines = yaml.split('\n');
  let inSection = false;
  const result: string[] = [];

  for (const line of lines) {
    // Início da seção alvo
    if (line.startsWith(`${sectionName}:`)) {
      inSection = true;
      result.push(line);
      continue;
    }

    if (inSection) {
      // Linha sem indentação com chave YAML = início de outra seção raiz
      if (line.length > 0 && !/^\s/.test(line) && /^[a-z_]+:/.test(line)) {
        break;
      }
      result.push(line);
    }
  }

  return result.length > 0 ? result.join('\n').trimEnd() : null;
}

/**
 * Lê o arquivo .md de um copywriter e extrai apenas as seções
 * relevantes para geração de copy (core_frameworks, core_principles,
 * writing_style, how_[name]_thinks). Descarta biography, famous_works
 * e relationships para economizar tokens.
 *
 * Retorna string com no máximo ~3.000 tokens por copywriter.
 */
export async function loadCopywriterContext(id: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'copywriters', `${id}.md`);
  const raw = await fs.readFile(filePath, 'utf-8');

  const sections: string[] = [];

  // 1. Extrai bloco YAML
  const yamlMatch = raw.match(/```yaml\n([\s\S]*?)```/);
  if (yamlMatch) {
    const yaml = yamlMatch[1];

    // Valida que não é seção proibida antes de extrair
    const skipSet = new Set(SKIP_SECTIONS);

    for (const name of KEEP_SECTIONS) {
      if (skipSet.has(name)) continue;
      const extracted = extractYamlSection(yaml, name);
      if (extracted) {
        sections.push(`### ${name.replace(/_/g, ' ')}\n\n${extracted}`);
      }
    }
  }

  // 2. Extrai seção "## How [Name] Thinks" (fora do YAML)
  const howMatch = raw.match(/## How .+ Thinks\n([\s\S]*?)(?=\n## |\n```yaml|$)/);
  if (howMatch) {
    sections.push(`### como pensa\n\n${howMatch[1].trim()}`);
  }

  const combined = sections.join('\n\n');

  // Trunca se necessário
  return combined.length > MAX_CHARS_PER_COPYWRITER
    ? combined.slice(0, MAX_CHARS_PER_COPYWRITER) + '\n[contexto truncado]'
    : combined;
}
