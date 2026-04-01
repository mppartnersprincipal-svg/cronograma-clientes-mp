import { NextRequest, NextResponse } from 'next/server';
import { loadClientKnowledge } from '@/lib/knowledge-base';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Parâmetro "slug" é obrigatório' }, { status: 400 });
  }

  try {
    const knowledge = await loadClientKnowledge(slug);
    return NextResponse.json(knowledge);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('não encontrado')) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Erro ao carregar base de conhecimento' },
      { status: 500 }
    );
  }
}
