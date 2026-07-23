import 'server-only';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const appParts = [0, 1, 2, 3];

export function getMezgebAppHtml(): string {
  const encoded = appParts
    .map((part) =>
      readFileSync(path.join(process.cwd(), 'public', `mezgeb-app.part-${part}.txt`), 'utf8')
    )
    .join('')
    .replace(/\s/g, '');

  return gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
}
