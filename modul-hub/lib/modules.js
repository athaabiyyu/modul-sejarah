import { list, put, del } from '@vercel/blob';

const PREFIX = 'meta/';

export function storageReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getModules() {
  if (!storageReady()) return [];
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  const items = await Promise.all(
    blobs.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );
  return items
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addModule(data) {
  const id = crypto.randomUUID();
  const item = {
    id,
    title: String(data.title || data.filename || 'Tanpa judul').slice(0, 200),
    description: String(data.description || '').slice(0, 1000),
    url: data.url,
    filename: data.filename,
    size: Number(data.size) || 0,
    contentType: data.contentType || '',
    createdAt: new Date().toISOString(),
  };
  await put(`${PREFIX}${id}.json`, JSON.stringify(item), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  return item;
}

export async function deleteModule(id) {
  const { blobs } = await list({ prefix: `${PREFIX}${id}.json`, limit: 1 });
  const meta = blobs[0];
  if (!meta) return false;
  let fileUrl = null;
  try {
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (res.ok) fileUrl = (await res.json()).url;
  } catch {}
  await del([meta.url, ...(fileUrl ? [fileUrl] : [])]);
  return true;
}
