import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const CLIENTS_DIR = path.join(process.cwd(), 'clients');
const MAX_CONTEXT_CHARS = 60_000;

export interface ClientKnowledge {
  profile: string;
  approvedAngles: string[];
  fullContext: string;
}

// Tipos internos para módulos sem declarações
type MammothModule = {
  extractRawText: (opts: { path: string }) => Promise<{ value: string }>;
};
type PdfParseModule = (buffer: Buffer) => Promise<{ text: string }>;

async function readFileContent(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt') {
    return fs.readFile(filePath, 'utf-8');
  }

  if (ext === '.md') {
    const raw = await fs.readFile(filePath, 'utf-8');
    // Preserva frontmatter + conteúdo para manter metadados do cliente legíveis
    return raw;
  }

  if (ext === '.pdf') {
    const { default: pdfParse } = (await import('pdf-parse')) as unknown as {
      default: PdfParseModule;
    };
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === '.docx') {
    const mammoth = (await import('mammoth')) as unknown as MammothModule;
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // Formato não suportado — ignora silenciosamente
  return '';
}

async function listFilesSortedByMtime(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => path.join(dir, e.name));

    const withStats = await Promise.all(
      files.map(async (f) => ({
        filePath: f,
        mtime: (await fs.stat(f)).mtimeMs,
      }))
    );

    // Mais recentes primeiro
    return withStats.sort((a, b) => b.mtime - a.mtime).map((f) => f.filePath);
  } catch {
    return [];
  }
}

export async function loadClientKnowledge(
  clientSlug: string
): Promise<ClientKnowledge> {
  const clientDir = path.join(CLIENTS_DIR, clientSlug);

  try {
    await fs.access(clientDir);
  } catch {
    throw new Error(`Cliente "${clientSlug}" não encontrado em /clients/`);
  }

  const sections: string[] = [];
  let profile = '';
  const approvedAngles: string[] = [];

  // 1. info.md — prioridade máxima
  const infoPath = path.join(clientDir, 'info.md');
  try {
    const raw = await fs.readFile(infoPath, 'utf-8');
    const { data } = matter(raw);
    profile = raw;
    const label = (data.name as string | undefined) ?? clientSlug;
    sections.push(`# PERFIL DO CLIENTE: ${label}\n\n${raw}`);
  } catch {
    // info.md ausente — continua sem perfil estruturado
  }

  // 2. Demais arquivos na raiz do cliente (ex: manual-marca.pdf)
  try {
    const entries = await fs.readdir(clientDir, { withFileTypes: true });
    const rootFiles = entries
      .filter((e) => e.isFile() && e.name !== 'info.md')
      .map((e) => path.join(clientDir, e.name));

    for (const filePath of rootFiles) {
      try {
        const content = await readFileContent(filePath);
        if (content.trim()) {
          sections.push(
            `# DOCUMENTO: ${path.basename(filePath)}\n\n${content}`
          );
        }
      } catch {
        // Arquivo ilegível — ignora
      }
    }
  } catch {
    // Diretório inacessível — ignora
  }

  // 3. Roteiros aprovados (mais recentes primeiro)
  const roteirosDir = path.join(clientDir, 'roteiros-aprovados');
  const roteirosFiles = await listFilesSortedByMtime(roteirosDir);

  for (const filePath of roteirosFiles) {
    try {
      const content = await readFileContent(filePath);
      if (content.trim()) {
        approvedAngles.push(content.trim());
        sections.push(
          `# ROTEIRO APROVADO: ${path.basename(filePath)}\n\n${content}`
        );
      }
    } catch {
      // Ignora arquivos com erro de leitura
    }
  }

  // 4. Briefings aprovados (mais recentes primeiro)
  const briefingsDir = path.join(clientDir, 'briefings-aprovados');
  const briefingsFiles = await listFilesSortedByMtime(briefingsDir);

  for (const filePath of briefingsFiles) {
    try {
      const content = await readFileContent(filePath);
      if (content.trim()) {
        approvedAngles.push(content.trim());
        sections.push(
          `# BRIEFING APROVADO: ${path.basename(filePath)}\n\n${content}`
        );
      }
    } catch {
      // Ignora arquivos com erro de leitura
    }
  }

  const rawContext = sections.join('\n\n---\n\n');
  const fullContext =
    rawContext.length > MAX_CONTEXT_CHARS
      ? rawContext.slice(0, MAX_CONTEXT_CHARS) + '\n\n[contexto truncado]'
      : rawContext;

  return { profile, approvedAngles, fullContext };
}
