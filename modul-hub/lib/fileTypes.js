export const KINDS = {
  pdf: { label: 'PDF', cls: 'k-pdf' },
  word: { label: 'Word', cls: 'k-word' },
  ppt: { label: 'PowerPoint', cls: 'k-ppt' },
  excel: { label: 'Excel', cls: 'k-excel' },
  image: { label: 'Gambar', cls: 'k-image' },
  video: { label: 'Video', cls: 'k-video' },
  audio: { label: 'Audio', cls: 'k-audio' },
  other: { label: 'Lainnya', cls: 'k-other' },
};

const MAP = {
  pdf: 'pdf',
  doc: 'word', docx: 'word', odt: 'word', rtf: 'word',
  ppt: 'ppt', pptx: 'ppt', odp: 'ppt',
  xls: 'excel', xlsx: 'excel', csv: 'excel', ods: 'excel',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image',
  mp4: 'video', webm: 'video', mov: 'video', m4v: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
};

export function getExt(name = '') {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function getKind(name = '') {
  return MAP[getExt(name)] || 'other';
}

export function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}
