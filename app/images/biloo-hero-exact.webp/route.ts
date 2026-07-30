const highResolutionSource =
  'https://media.canva.com/v2/image-resize/format:WEBP/height:1024/quality:95/uri:ifs%3A%2F%2FM%2F06020d07-3aff-4c37-ae90-7fe5671295a1/watermark:F/width:1536?csig=AAAAAAAAAAAAAAAAAAAAACgiopAh7bEAz9wmOSN4gFD3x7xQynkiBWgrUltqvZxQ&exp=1785451902&osig=AAAAAAAAAAAAAAAAAAAAAB__WcHkYmS3dXAeH_BOTEP_cKhHVeDfdTrIfdYeIq4z&signer=media-rpc';

const fallbackSource =
  'https://media.canva.com/v2/image-resize/format:JPG/height:133/quality:75/uri:ifs%3A%2F%2FM%2F06020d07-3aff-4c37-ae90-7fe5671295a1/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAACgiopAh7bEAz9wmOSN4gFD3x7xQynkiBWgrUltqvZxQ&exp=1785451902&osig=AAAAAAAAAAAAAAAAAAAAAB__WcHkYmS3dXAeH_BOTEP_cKhHVeDfdTrIfdYeIq4z&signer=media-rpc&x-canva-quality=thumbnail';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = false;

async function loadHeroImage() {
  for (const source of [highResolutionSource, fallbackSource]) {
    const response = await fetch(source, { cache: 'force-cache' });
    if (response.ok) return response;
  }

  throw new Error('The approved Biloo Mezgeb hero artwork could not be loaded.');
}

export async function GET() {
  const source = await loadHeroImage();
  const image = await source.arrayBuffer();
  const contentType = source.headers.get('content-type') || 'image/webp';

  return new Response(image, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Content-Length': String(image.byteLength),
    },
  });
}
