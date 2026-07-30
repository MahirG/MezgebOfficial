const highResolutionSource =
  'https://media.canva.com/v2/image-resize/format:WEBP/height:3840/quality:95/uri:ifs%3A%2F%2FM%2F319ebca4-f8ff-4d86-883f-a7da7de0257b/watermark:F/width:2160?csig=AAAAAAAAAAAAAAAAAAAAAAg17h-p0BYh2-FzwJqZ8CM8qyjw3T-FoL03IOWk4kcD&exp=1785458638&osig=AAAAAAAAAAAAAAAAAAAAAI9H9P6nuP2IYI61VmYKQLPhOwc8aW1ER2vB_st7MG6m&signer=media-rpc';

const fallbackSource =
  'https://media.canva.com/v2/image-resize/format:JPG/height:200/quality:75/uri:ifs%3A%2F%2FM%2F319ebca4-f8ff-4d86-883f-a7da7de0257b/watermark:F/width:112?csig=AAAAAAAAAAAAAAAAAAAAAAg17h-p0BYh2-FzwJqZ8CM8qyjw3T-FoL03IOWk4kcD&exp=1785458638&osig=AAAAAAAAAAAAAAAAAAAAAI9H9P6nuP2IYI61VmYKQLPhOwc8aW1ER2vB_st7MG6m&signer=media-rpc&x-canva-quality=thumbnail';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = false;

async function loadImage() {
  for (const source of [highResolutionSource, fallbackSource]) {
    const response = await fetch(source, { cache: 'force-cache' });
    if (response.ok) return response;
  }
  throw new Error('Unable to load the Biloo Mezgeb mobile hero asset.');
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
