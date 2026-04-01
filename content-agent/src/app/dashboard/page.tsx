import { Suspense } from 'react';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { prisma } from '@/lib/db';
import ClientSelector, {
  ClientSelectorSkeleton,
  type ClientCardData,
} from '@/components/ClientSelector';

const CLIENTS_DIR = path.join(process.cwd(), 'clients');

export const metadata = {
  title: 'Clientes — Content Agent',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            M|P Assessoria
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Content Agent
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione um cliente para começar a gerar conteúdo.
          </p>
        </header>

        {/* Lista de clientes com Suspense */}
        <Suspense fallback={<ClientSelectorSkeleton />}>
          <ClientsData />
        </Suspense>
      </div>
    </main>
  );
}

// ─── Server component assíncrono ─────────────────────────────────────────────

async function ClientsData() {
  // 1. Lê subpastas de /clients/
  let slugs: string[] = [];
  try {
    const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
    slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    // pasta /clients/ ainda não existe
  }

  // 2. Extrai metadados do info.md de cada cliente
  const clientsRaw = await Promise.all(
    slugs.map(async (dirName) => {
      const infoPath = path.join(CLIENTS_DIR, dirName, 'info.md');
      try {
        const raw = await fs.readFile(infoPath, 'utf-8');
        const { data } = matter(raw);
        return {
          slug: (data.slug as string | undefined) ?? dirName,
          name: (data.name as string | undefined) ?? dirName,
          niche: (data.niche as string | undefined) ?? '',
        };
      } catch {
        return { slug: dirName, name: dirName, niche: '' };
      }
    })
  );

  // 3. Busca data do último conteúdo por cliente no SQLite
  const lastContents = await prisma.content.groupBy({
    by: ['clientSlug'],
    _max: { createdAt: true },
  });

  const lastContentMap = new Map<string, Date | null>(
    lastContents.map((row) => [
      row.clientSlug,
      (row._max.createdAt as Date | null) ?? null,
    ])
  );

  // 4. Mescla e ordena por nome
  const clients: ClientCardData[] = clientsRaw
    .map((c) => ({
      ...c,
      lastContentAt: lastContentMap.get(c.slug)?.toISOString() ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return <ClientSelector clients={clients} />;
}
