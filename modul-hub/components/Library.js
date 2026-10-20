'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { KINDS, getKind, getExt, formatSize, formatDate } from '@/lib/fileTypes';

const Flipbook = dynamic(() => import('./Flipbook'), { ssr: false });

function Viewer({ item, onClose }) {
  const kind = getKind(item.filename || item.url);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  let body;
  let light = false;
  if (kind === 'pdf') {
    body = <Flipbook url={item.url} />;
  } else if (kind === 'image') {
    body = <img src={item.url} alt={item.title} />;
  } else if (kind === 'video') {
    body = <video src={item.url} controls autoPlay />;
  } else if (kind === 'audio') {
    body = <audio src={item.url} controls autoPlay />;
  } else if (kind === 'word' || kind === 'ppt' || kind === 'excel') {
    body = (
      <iframe
        title={item.title}
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.url)}`}
      />
    );
  } else {
    light = true;
    body = (
      <div className="fallback">
        <p>Pratinjau tidak tersedia untuk tipe file ini.</p>
        <a className="btn" href={item.url} download>Unduh file</a>
      </div>
    );
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${kind === 'pdf' ? 'tall' : ''}`}>
        <div className="modal-head">
          <h2>{item.title}</h2>
          <a className="btn ghost sm" href={item.url} download target="_blank" rel="noreferrer">Unduh</a>
          <button className="btn sm" onClick={onClose}>Tutup</button>
        </div>
        <div className={`modal-body ${light ? 'light' : ''}`}>{body}</div>
      </div>
    </div>
  );
}

export default function Library({ modules }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const withKind = useMemo(
    () => modules.map((m) => ({ ...m, kind: getKind(m.filename || m.url) })),
    [modules]
  );

  const kinds = useMemo(() => {
    const set = new Set(withKind.map((m) => m.kind));
    return Object.keys(KINDS).filter((k) => set.has(k));
  }, [withKind]);

  const shown = withKind.filter((m) => {
    if (filter !== 'all' && m.kind !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return m.title.toLowerCase().includes(s) || (m.description || '').toLowerCase().includes(s);
  });

  return (
    <div className="container">
      <div className="toolbar">
        <input
          className="search"
          placeholder="Cari modul…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Semua</button>
          {kinds.map((k) => (
            <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
              {KINDS[k].label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty">{modules.length === 0 ? 'Belum ada modul yang diunggah.' : 'Tidak ada modul yang cocok.'}</div>
      ) : (
        <div className="grid">
          {shown.map((m) => (
            <button key={m.id} className="card" onClick={() => setOpen(m)}>
              <div className={`thumb ${KINDS[m.kind].cls}`}>
                {m.kind === 'image' ? <img src={m.url} alt="" loading="lazy" /> : KINDS[m.kind].label}
                <span className="ext">{getExt(m.filename || m.url).toUpperCase()}</span>
              </div>
              <div className="card-body">
                <h3>{m.title}</h3>
                {m.description && <p>{m.description}</p>}
                <div className="meta">{formatDate(m.createdAt)} · {formatSize(m.size)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && <Viewer item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}