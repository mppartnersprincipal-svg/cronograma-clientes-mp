import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { prisma } from '@/lib/db';
import HistoricoClient, { type ContentRow } from './HistoricoClient';

const CLIENTS_DIR = path.join(process.cwd(), 'clients');

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  try {
    const raw = await fs.readFile(path.join(CLIENTS_DIR, slug, 'info.md'), 'utf-8');
    const { data } = matter(raw);
    return { title: `Histórico — ${(data.name as string | undefined) ?? slug}` };
  } catch {
    return { title: 'Histórico' };
  }
}

export default async function HistoricoPage({ params }: Props) {
  const { slug } = params;

  let clientName = slug;
  try {
    const raw = await fs.readFile(path.join(CLIENTS_DIR, slug, 'info.md'), 'utf-8');
    const { data } = matter(raw);
    clientName = (data.name as string | undefined) ?? slug;
  } catch {
    notFound();
  }

  const records = await prisma.content.findMany({
    where: { clientSlug: slug },
    orderBy: { createdAt: 'desc' },
  });

  // Serializa as datas para evitar erro de serialização server→client
  const contents: ContentRow[] = records.map((r) => ({
    id: r.id,
    contentType: r.contentType,
    title: r.title,
    framework: r.framework,
    filePath: r.filePath,
    createdAt: r.createdAt,
    status: r.status,
  }));

  return (
    <HistoricoClient
      clientName={clientName}
      slug={slug}
      contents={contents}
    />
  );
}
