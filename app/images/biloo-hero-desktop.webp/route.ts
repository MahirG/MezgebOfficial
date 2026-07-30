const highResolutionSource =
  'https://media.canva.com/v2/image-resize/format:WEBP/height:2560/quality:95/uri:ifs%3A%2F%2FM%2F7dc614c2-6320-4ed6-aaa9-dd83f4ca2ab5/watermark:F/width:3840?csig=AAAAAAAAAAAAAAAAAAAAAB0OZ_vq0sgQngKEjZ7L_2j-aOn_mrk2QA9l2fCpWdDT&exp=1785458909&osig=AAAAAAAAAAAAAAAAAAAAAKvzLClujsbEO9kmLal92h3Cf3PcXVZyz0F2frvbUzbz&signer=media-rpc';

const fallbackSource =
  'https://media.canva.com/v2/image-resize/format:JPG/height:133/quality:75/uri:ifs%3A%2F%2FM%2F7dc614c2-6320-4ed6-aaa9-dd83f4ca2ab5/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAAB0OZ_vq0sgQngKEjZ7L_2j-aOn_mrk2QA9l2fCpWdDT&exp=1785458909&osig=AAAAAAAAAAAAAAAAAAAAAKvzLClujsbEO9kmLal92h3Cf3PcXVZyz0F2frvbUzbz&signer=media-rpc&x-canva-quality=thumbnail';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = false;

async function loadImage() {
  for (const source of [highResolutionSource, fallbackSource]) {
    const response = await fetch(source, { cache: 'force-cache' });
    if (response.ok) return response;
  }
  throw new Error('Unable to load the Biloo Mezgeb desktop hero asset.');
}

export async function GET() {
  const source = await loadImage();
  const image = await source.arrayBuffer();

  return new Response(image, {
    headers: {
      'Content-Type': source.headers.get('content-type') || 'image/webp',
      'Content-Length': String(image.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
