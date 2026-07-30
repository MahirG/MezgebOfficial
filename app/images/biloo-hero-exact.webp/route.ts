const fullResolutionSource =
  'https://s3.amazonaws.com/document-export.canva.com/SJHWg/DAHQ4hSJHWg/1/thumbnail/0001.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUHYGFFNMW3%2F20260730%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260730T152458Z&X-Amz-Expires=15441&X-Amz-Signature=4a92e05c6518f3d36dd6f07a3266b64494a102e379cfe26e4ec9614661f9ffdf&X-Amz-SignedHeaders=host&response-expires=Thu%2C%2030%20Jul%202026%2019%3A42%3A19%20GMT';

const fallbackSource =
  'https://media.canva.com/v2/image-resize/format:JPG/height:133/quality:75/uri:ifs%3A%2F%2FM%2F06020d07-3aff-4c37-ae90-7fe5671295a1/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAACgiopAh7bEAz9wmOSN4gFD3x7xQynkiBWgrUltqvZxQ&exp=1785451902&osig=AAAAAAAAAAAAAAAAAAAAAB__WcHkYmS3dXAeH_BOTEP_cKhHVeDfdTrIfdYeIq4z&signer=media-rpc&x-canva-quality=thumbnail';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = false;

async function loadHeroImage() {
  for (const source of [fullResolutionSource, fallbackSource]) {
    const response = await fetch(source, { cache: 'force-cache' });
    if (response.ok) return response;
  }

  throw new Error('The approved Biloo Mezgeb hero artwork could not be loaded.');
}

export async function GET() {
  const source = await loadHeroImage();
  const image = await source.arrayBuffer();
  const contentType = source.headers.get('content-type') || 'image/png';

  return new Response(image, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Content-Length': String(image.byteLength),
    },
  });
}
