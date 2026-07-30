import part1 from '@/lib/presenter-data/part1';
import part2 from '@/lib/presenter-data/part2';
import part3 from '@/lib/presenter-data/part3';
import part4 from '@/lib/presenter-data/part4';
import part5 from '@/lib/presenter-data/part5';
import part6 from '@/lib/presenter-data/part6';
import part7 from '@/lib/presenter-data/part7';
import part8 from '@/lib/presenter-data/part8';

const presenterImage = Buffer.from(
  [part1, part2, part3, part4, part5, part6, part7, part8].join(''),
  'base64',
);

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export function GET() {
  return new Response(presenterImage, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=0, s-maxage=31536000, immutable',
      'Content-Length': String(presenterImage.byteLength),
    },
  });
}
