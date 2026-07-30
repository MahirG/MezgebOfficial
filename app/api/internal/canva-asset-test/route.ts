const candidates = [
  'https://media.canva.com/v2/document-image/hash:-882793407/height:365/id:DAHQ5PRT4oY/type:B/width:547?brand=BAEfjTL3_Ik&csig=AAAAAAAAAAAAAAAAAAAAAG_4q_SUlGIBqCK6j7yac39NsNILZOb1GitbcOiQ7TUh&disableexport=T&exp=1785448673&fallback=https%3A%2F%2Fs3.amazonaws.com%2Fdocument-export.canva.com%2FRT4oY%2FDAHQ5PRT4oY%2F1%2Fthumbnail%2F0001.png%3FX-Amz-Algorithm%3DAWS4-HMAC-SHA256%26X-Amz-Credential%3DAKIAQYCGKMUHYGFFNMW3%252F20260730%252Fus-east-1%252Fs3%252Faws4_request%26X-Amz-Date%3D20260730T201443Z%26X-Amz-Expires%3D6190%26X-Amz-Signature%3Da0f434c113c02a18e3d37160943bf954812139a54572de8fad3884999fbd37db%26X-Amz-SignedHeaders%3Dhost%26response-expires%3DThu%252C%252030%2520Jul%25202026%252021%253A57%253A53%2520GMT&osig=AAAAAAAAAAAAAAAAAAAAAKTyK2w11oNO5RGlsbCvBZzLq-MzqPJSWRrySWkRw-Ho&page=1&signed=brand%2Cdisableexport%2Cfallback%2Cpage%2Cversion&signer=document-rpc&version=1',
  'https://s3.amazonaws.com/document-export.canva.com/RT4oY/DAHQ5PRT4oY/1/thumbnail/0001.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUHYGFFNMW3%2F20260730%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260730T201443Z&X-Amz-Expires=6190&X-Amz-Signature=a0f434c113c02a18e3d37160943bf954812139a54572de8fad3884999fbd37db&X-Amz-SignedHeaders=host&response-expires=Thu%2C%2030%20Jul%202026%2021%3A57%3A53%20GMT',
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pngDimensions(bytes: Uint8Array) {
  const isPng = bytes.length >= 24 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  if (!isPng) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export async function GET() {
  const results = [];

  for (const [index, url] of candidates.entries()) {
    try {
      const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      results.push({
        index,
        ok: response.ok,
        status: response.status,
        type: response.headers.get('content-type'),
        length: bytes.byteLength,
        dimensions: pngDimensions(bytes),
        finalUrl: response.url,
        prefix: Array.from(bytes.slice(0, 12)),
      });
    } catch (error) {
      results.push({ index, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return Response.json(results, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
