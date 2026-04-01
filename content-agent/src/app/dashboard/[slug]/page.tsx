import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { prisma } from '@/lib/db';
import AgentChat from '@/components/AgentChat';

const CLIENTS_DIR = path.join(process.cwd(), 'clients');

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  try {
    const raw = await fs.readFile(path.join(CLIENTS_DIR, slug, 'info.md'), 'utf-8');
    const { data } = matter(raw);
    return { title: `${(data.name as string | undefined) ?? slug} — Content Agent` };
  } catch {
    return { title: 'Content Agent' };
  }
}

export default async function ClientPage({ params }: Props) {
  const { slug } = params;

  const infoPath = path.join(CLIENTS_DIR, slug, 'info.md');
  let clientName = slug;
  let clientNiche = '';

  try {
    const raw = await fs.readFile(infoPath, 'utf-8');
    const { data } = matter(raw);
    clientName = (data.name as string | undefined) ?? slug;
    clientNiche = (data.niche as string | undefined) ?? '';
  } catch {
    notFound();
  }

  const contentCount = await prisma.content.count({
    where: { clientSlug: slug },
  });

  return (
    <AgentChat
      clientSlug={slug}
      clientName={clientName}
      clientNiche={clientNiche}
      contentCount={contentCount}
    />
  );
}
