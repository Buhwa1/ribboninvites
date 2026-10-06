// File storage. Uses Vercel Blob in production, a local folder during development.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), '.data', 'uploads');

export async function putFile(name, buffer, contentType) {
  const safe = name.replace(/[^\w.-]/g, '_').slice(-80);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const r = await put('invites/' + safe, buffer, { access: 'public', contentType, addRandomSuffix: true });
    return r.url;
  }
  if (process.env.VERCEL) throw new Error('File storage is not configured. Add a Vercel Blob store to this project.');
  fs.mkdirSync(DIR, { recursive: true });
  const fn = Date.now().toString(36) + '-' + safe;
  fs.writeFileSync(path.join(DIR, fn), buffer);
  return '/uploads/' + fn;
}

export async function deleteFile(url) {
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN && /^https?:\/\//.test(url)) {
      const { del } = await import('@vercel/blob');
      await del(url);
    } else if (url && url.startsWith('/uploads/')) {
      fs.unlinkSync(path.join(DIR, path.basename(url)));
    }
  } catch { /* already gone */ }
}
