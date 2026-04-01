import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const CLIENTS_DIR = path.join(process.cwd(), 'clients');

interface ClientInfo {
  slug: string;
  name: string;
  niche: string;
}

export async function GET() {
  try {
    const entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());

    const clients: ClientInfo[] = await Promise.all(
      dirs.map(async (dir) => {
        const infoPath = path.join(CLIENTS_DIR, dir.name, 'info.md');
        try {
          const raw = await fs.readFile(infoPath, 'utf-8');
          const { data } = matter(raw);
          return {
            slug: (data.slug as string | undefined) ?? dir.name,
            name: (data.name as string | undefined) ?? dir.name,
            niche: (data.niche as string | undefined) ?? '',
          };
        } catch {
          // info.md ausente — inclui com dados mínimos derivados do nome da pasta
          return { slug: dir.name, name: dir.name, niche: '' };
        }
      })
    );

    clients.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: 'Erro ao listar clientes' }, { status: 500 });
  }
}
