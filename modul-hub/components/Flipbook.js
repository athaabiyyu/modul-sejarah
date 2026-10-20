'use client';

import { useEffect, useRef, useState } from 'react';

const PAGE_W = 450;

export default function Flipbook({ url }) {
  const wrapRef = useRef(null);
  const hostRef = useRef(null);
  const flipRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    let pdf = null;
    let flip = null;
    const rendered = new Set();
    const canvases = [];
    let queue = Promise.resolve();

    async function renderPage(i) {
      if (i < 0 || i >= canvases.length || rendered.has(i)) return;
      rendered.add(i);
      queue = queue.then(async () => {
        if (cancelled) return;
        try {
          const p = await pdf.getPage(i + 1);
          const base = p.getViewport({ scale: 1 });
          const scale = Math.min(2, 1000 / base.width);
          const vp = p.getViewport({ scale });
          const c = canvases[i];
          c.width = vp.width;
          c.height = vp.height;
          await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        } catch (e) {
          rendered.delete(i);
        }
      });
    }

    function renderAround(idx) {
      for (let k = idx - 2; k <= idx + 5; k++) renderPage(k);
    }

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        pdf = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;

        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        const pageH = Math.round((PAGE_W * vp.height) / vp.width);

        const host = hostRef.current;
        host.innerHTML = '';
        const els = [];
        for (let i = 0; i < pdf.numPages; i++) {
          const div = document.createElement('div');
          div.className = 'flip-page';
          const canvas = document.createElement('canvas');
          div.appendChild(canvas);
          host.appendChild(div);
          els.push(div);
          canvases.push(canvas);
        }

        const { PageFlip } = await import('page-flip');
        flip = new PageFlip(host, {
          width: PAGE_W,
          height: pageH,
          size: 'stretch',
          minWidth: 260,
          maxWidth: 560,
          minHeight: 340,
          maxHeight: 900,
          showCover: true,
          usePortrait: true,
          maxShadowOpacity: 0.4,
          mobileScrollSupport: false,
        });
        flip.loadFromHTML(els);
        flipRef.current = flip;
        setTotal(pdf.numPages);
        setStatus('ready');
        renderAround(0);

        flip.on('flip', (e) => {
          setPage(e.data + 1);
          renderAround(e.data);
        });
      } catch (e) {
        if (!cancelled) {
          setErrMsg(e?.message || 'Gagal membuka PDF');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      try { flip && flip.destroy(); } catch {}
      try { pdf && pdf.destroy(); } catch {}
      flipRef.current = null;
    };
  }, [url]);

  const label = () => {
    if (!total) return '';
    // Mode dua halaman: tampilkan "6-7 / 160"
    const right = page + 1;
    const two = typeof window !== 'undefined' && window.innerWidth > 700 && page > 1 && right <= total;
    return two ? `${page}-${right} / ${total}` : `${page} / ${total}`;
  };

  function fullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <div className="flip-wrap" ref={wrapRef}>
      {status === 'ready' && <div className="flip-counter">{label()}</div>}
      {status === 'ready' && (
        <>
          <button className="flip-nav prev" aria-label="Sebelumnya" onClick={() => flipRef.current?.flipPrev()}>‹</button>
          <button className="flip-nav next" aria-label="Berikutnya" onClick={() => flipRef.current?.flipNext()}>›</button>
        </>
      )}
      {status === 'loading' && <div className="flip-msg">Memuat dokumen…</div>}
      {status === 'error' && <div className="flip-msg">Gagal membuka PDF: {errMsg}</div>}
      <div className="flip-stage" style={{ display: status === 'ready' ? 'flex' : 'none' }}>
        <div ref={hostRef} />
      </div>
      {status === 'ready' && (
        <div className="flip-bar">
          <button className="btn ghost sm" onClick={() => flipRef.current?.flip(0)}>⏮ Awal</button>
          <button className="btn ghost sm" onClick={fullscreen}>⛶ Layar penuh</button>
          <button className="btn ghost sm" onClick={() => flipRef.current?.flip(total - 1)}>Akhir ⏭</button>
        </div>
      )}
    </div>
  );
}
