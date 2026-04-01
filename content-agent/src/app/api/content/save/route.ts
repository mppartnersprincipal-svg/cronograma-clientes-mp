import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ContentType =
  | 'reels-valor'
  | 'reels-institucional'
  | 'anuncio'
  | 'peca-estatica'
  | 'carrossel';

interface SaveBody {
  clientSlug: string;
  contentType: ContentType;
  title: string;
  framework: string;
  body: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CLIENTS_DIR = path.join(process.cwd(), 'clients');

// Tipos de vídeo vão para roteiros-aprovados; estáticos para briefings-aprovados
const VIDEO_TYPES: ContentType[] = ['reels-valor', 'reels-institucional', 'anuncio'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function isValidBody(b: unknown): b is SaveBody {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o.clientSlug === 'string' &&
    typeof o.contentType === 'string' &&
    typeof o.title === 'string' &&
    typeof o.framework === 'string' &&
    typeof o.body === 'string'
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  if (!isValidBody(raw)) {
    return Response.json(
      { error: 'Campos obrigatórios: clientSlug, contentType, title, framework, body' },
      { status: 400 }
    );
  }

  const { clientSlug, contentType, title, framework, body } = raw;

  const subDir = VIDEO_TYPES.includes(contentType) ? 'roteiros-aprovados' : 'briefings-aprovados';
  const clientDir = path.join(CLIENTS_DIR, clientSlug, subDir);

  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `${dateStr}_${contentType}_${slugify(title)}.md`;
  const absPath = path.join(clientDir, filename);
  const relPath = `clients/${clientSlug}/${subDir}/${filename}`;

  try {
    await fs.mkdir(clientDir, { recursive: true });
    await fs.writeFile(absPath, body, 'utf-8');
  } catch {
    return Response.json({ error: 'Erro ao salvar arquivo no disco' }, { status: 500 });
  }

  try {
    const record = await prisma.content.create({
      data: {
        clientSlug,
        contentType,
        title,
        framework,
        filePath: relPath,
        status: 'approved',
      },
    });
    return Response.json({ id: record.id, filePath: relPath });
  } catch {
    return Response.json({ error: 'Erro ao registrar no banco de dados' }, { status: 500 });
  }
}
