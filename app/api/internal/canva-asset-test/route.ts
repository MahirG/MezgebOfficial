const origin = 'https://media.canva.com/v2/image-resize';
const uri = 'ifs%3A%2F%2FM%2F7dc614c2-6320-4ed6-aaa9-dd83f4ca2ab5';
const csig = 'AAAAAAAAAAAAAAAAAAAAAGvpkHNBoz8InnRjmnjMy3KoblRjodhSU5ZRhJx_W63I';
const osig = 'AAAAAAAAAAAAAAAAAAAAALQ0f32sbmAX8BXKBXm1f3c1QGs0-3CF64pSKuoLbVCo';
const exp = '1785462509';
const common = `exp=${exp}&osig=${osig}&signer=media-rpc`;

const candidates = [
  `${origin}/format:JPG/height:133/quality:75/uri:${uri}/watermark:F/width:200?csig=${csig}&${common}&x-canva-quality=thumbnail`,
  `${origin}/format:WEBP/height:2560/quality:95/uri:${uri}/watermark:F/width:3840?csig=${csig}&${common}&x-canva-quality=thumbnail`,
  `${origin}/format:WEBP/height:2560/quality:95/uri:${uri}/watermark:F/width:3840?${common}`,
  `${origin}/format:WEBP/height:2560/quality:95/uri:${uri}/width:3840?${common}`,
  `${origin}/format:WEBP/quality:95/uri:${uri}/watermark:F?${common}`,
  `${origin}/format:WEBP/uri:${uri}/watermark:F?${common}`,
  `${origin}/format:WEBP/uri:${uri}?${common}`,
  `${origin}/format:JPG/height:1024/quality:90/uri:${uri}/watermark:F/width:1536?${common}`,
  `${origin}/format:JPG/height:2560/quality:95/uri:${uri}/watermark:F/width:3840?${common}`,
  `${origin}/format:PNG/height:2560/quality:100/uri:${uri}/watermark:F/width:3840?${common}`,
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const results = [];

  for (const [index, url] of candidates.entries()) {
    try {
      const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });
      const bytes = await response.arrayBuffer();
      results.push({
        index,
        ok: response.ok,
        status: response.status,
        type: response.headers.get('content-type'),
        length: bytes.byteLength,
        finalUrl: response.url,
        prefix: Array.from(new Uint8Array(bytes.slice(0, 12))),
      });
    } catch (error) {
      results.push({ index, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return Response.json(results, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
