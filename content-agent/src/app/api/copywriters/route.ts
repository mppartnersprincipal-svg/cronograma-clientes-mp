import { NextRequest } from 'next/server';
import { selectCopywriters } from '@/lib/copywriters/selector';
import type { ContentType } from '@/lib/copywriters/index';

const VALID_CONTENT_TYPES: ContentType[] = [
  'reels-valor',
  'reels-institucional',
  'anuncio',
  'peca-estatica',
  'carrossel',
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const contentType = searchParams.get('contentType') as ContentType | null;
  const niche = searchParams.get('niche') ?? '';

  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType)) {
    return Response.json(
      { error: 'Parâmetro contentType inválido ou ausente' },
      { status: 400 },
    );
  }

  const pair = selectCopywriters(contentType, niche);

  return Response.json(pair);
}
