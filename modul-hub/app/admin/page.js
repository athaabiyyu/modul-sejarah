'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { KINDS, getKind, getExt, formatSize, formatDate } from '@/lib/fileTypes';

export default function AdminPage() {
  const [modules, setModules] = useState([]);
  const [storageReady, setStorageReady] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/modules', { cache: 'no-store' });
      const data = await res.json();
      setModules(data.modules || []);
      setStorageReady(data.storageReady !== false);
    } catch {
      setMsg({ type: 'err', text: 'Gagal memuat daftar modul.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function pick(f) {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return setMsg({ type: 'err', text: 'Pilih file terlebih dahulu.' });
    setBusy(true);
    setProgress(0);
    setMsg(null);
    try {
      const blob = await upload(`modul/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || file.name,
          description: description.trim(),
          url: blob.url,
          filename: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menyimpan data');
      setMsg({ type: 'ok', text: 'Berhasil diunggah dan sudah tampil di halaman publik.' });
      setFile(null);
      setTitle('');
      setDescription('');
      if (inputRef.current) inputRef.current.value = '';
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Upload gagal.' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(m) {
    if (!confirm(`Hapus "${m.title}"? File akan dihapus permanen.`)) return;
    try {
      const res = await fetch(`/api/modules?id=${encodeURIComponent(m.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus');
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  }

  return (
    <main>
      <div className="topbar">
        <div className="container">
          <strong>Modul Hub · Admin</strong>
          <a href="/">← Lihat halaman publik</a>
        </div>
      </div>

      <div className="container admin-wrap">
        {!storageReady && (
          <div className="notice warn" style={{ marginBottom: 20 }}>
            BLOB_READ_WRITE_TOKEN belum diatur. Hubungkan Vercel Blob dulu agar upload bisa jalan.
          </div>
        )}

        <form className="panel" onSubmit={submit}>
          <h2>Unggah modul baru</h2>

          <div
            className={`dropzone ${over ? 'over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
          >
            {file ? (
              <><b>{file.name}</b><br />{formatSize(file.size)}</>
            ) : (
              <>Tarik file ke sini atau klik untuk memilih<br /><small>PDF, Word, PowerPoint, Excel, gambar, video, dll. (maks. 500 MB)</small></>
            )}
            <input ref={inputRef} type="file" hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="title">Judul</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Modul 4 – Pemanfaatan Papan Interaktif Digital" />
          </div>
          <div className="field">
            <label htmlFor="desc">Deskripsi (opsional)</label>
            <textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <button className="btn" disabled={busy || !file}>{busy ? `Mengunggah… ${progress}%` : 'Unggah'}</button>
          {busy && <div className="progress"><div style={{ width: `${progress}%` }} /></div>}
          {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
        </form>

        <div className="panel">
          <h2>Modul terunggah ({modules.length})</h2>
          {modules.length === 0 && <p style={{ color: 'var(--muted)', margin: 0 }}>Belum ada modul.</p>}
          {modules.map((m) => {
            const k = getKind(m.filename || m.url);
            return (
              <div className="list-row" key={m.id}>
                <div className={`tag ${KINDS[k].cls}`}>{getExt(m.filename || m.url).toUpperCase() || 'FILE'}</div>
                <div className="info">
                  <b>{m.title}</b>
                  <span>{formatDate(m.createdAt)} · {formatSize(m.size)}</span>
                </div>
                <a className="btn ghost sm" href={m.url} target="_blank" rel="noreferrer">Buka</a>
                <button className="btn danger sm" onClick={() => remove(m)}>Hapus</button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
