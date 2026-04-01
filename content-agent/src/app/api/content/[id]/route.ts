import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return Response.json({ error: 'ID inválido' }, { status: 400 });
  }

  const record = await prisma.content.findUnique({ where: { id } });
  if (!record) {
    return Response.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
  }

  if (!record.filePath) {
    return Response.json({ error: 'Arquivo não associado a este registro' }, { status: 404 });
  }

  const absPath = path.join(process.cwd(), record.filePath);
  try {
    const content = await fs.readFile(absPath, 'utf-8');
    return Response.json({ content, record });
  } catch {
    return Response.json({ error: 'Arquivo não encontrado no disco' }, { status: 404 });
  }
}
