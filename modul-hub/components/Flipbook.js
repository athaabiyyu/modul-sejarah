'use client';

import { useEffect, useRef, useState } from 'react';

export default function Flipbook({ url }) {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const flipRef = useRef(null);
  const pdfRef = useRef(null);
  const canvasesRef = useRef([]);
  const renderedRef = useRef(new Set());
  const queueRef = useRef(Promise.resolve());
  const aliveRef = useRef(true);
  const pageRef = useRef(0);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [ratio, setRatio] = useState(0.707); // lebar / tinggi halaman
  const [layoutKey, setLayoutKey] = useState(0);
  const [errMsg, setErrMsg] = useState('');

  function renderPage(i) {
    const canvases = canvasesRef.current;
    if (i < 0 || i >= canvases.length || renderedRef.current.has(i)) return;
    renderedRef.current.add(i);
    queueRef.current = queueRef.current.then(async () => {
      if (!aliveRef.current || !pdfRef.current) return;
      try {
        const p = await pdfRef.current.getPage(i + 1);
        const base = p.getViewport({ scale: 1 });
        const scale = Math.min(2, 1000 / base.width);
        const vp = p.getViewport({ scale });
        const c = canvases[i];
        c.width = vp.width;
        c.height = vp.height;
        await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      } catch (e) {
        renderedRef.current.delete(i);
      }
    });
  }

  function renderAround(idx) {
    for (let k = idx - 2; k <= idx + 5; k++) renderPage(k);
  }

  // 1) Muat PDF sekali per URL
  useEffect(() => {
    aliveRef.current = true;
    renderedRef.current = new Set();
    canvasesRef.current = [];
    pageRef.current = 0;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument({ url }).promise;
        if (!aliveRef.current) return;
        pdfRef.current = pdf;

        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        canvasesRef.current = Array.from({ length: pdf.numPages }, () => document.createElement('canvas'));
        setRatio(vp.width / vp.height);
        setTotal(pdf.numPages);
        setStatus('ready');
      } catch (e) {
        if (aliveRef.current) {
          setErrMsg(e?.message || 'Gagal membuka PDF');
          setStatus('error');
        }
      }
    })();

    return () => {
      aliveRef.current = false;
      try { pdfRef.current && pdfRef.current.destroy(); } catch { }
      pdfRef.current = null;
    };
  }, [url]);

  // 2) Bangun flipbook yang pas dengan ukuran area tampil
  useEffect(() => {
    if (status !== 'ready') return;
    const stage = stageRef.current;
    if (!stage) return;

    const mobile = stage.clientWidth < 700;
    const availW = stage.clientWidth - (mobile ? 24 : 140);
    const availH = stage.clientHeight - 24;
    let w = mobile ? Math.min(availW, availH * ratio) : Math.min(availW / 2, availH * ratio);
    w = Math.max(160, Math.floor(w));
    const h = Math.floor(w / ratio);

    const host = document.createElement('div');
    stage.appendChild(host);
    const els = canvasesRef.current.map((c) => {
      const d = document.createElement('div');
      d.className = 'flip-page';
      d.appendChild(c);
      host.appendChild(d);
      return d;
    });

    let flip = null;
    let cancelled = false;

    (async () => {
      const { PageFlip } = await import('page-flip');
      if (cancelled) return;
      flip = new PageFlip(host, {
        width: w,
        height: h,
        size: 'fixed',
        showCover: true,
        usePortrait: true,
        maxShadowOpacity: 0.4,
        mobileScrollSupport: false,
        startPage: pageRef.current,
      });
      flip.loadFromHTML(els);
      flipRef.current = flip;
      setPage(pageRef.current + 1);
      renderAround(pageRef.current);
      flip.on('flip', (e) => {
        pageRef.current = e.data;
        setPage(e.data + 1);
        renderAround(e.data);
      });
    })();

    return () => {
      cancelled = true;
      flipRef.current = null;
      try { flip && flip.destroy(); } catch { }
      host.remove();
    };
  }, [status, ratio, layoutKey]);

  // 3) Sesuaikan ulang saat ukuran area berubah (resize, layar penuh)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return;
    let t;
    let last = `${stage.clientWidth}x${stage.clientHeight}`;
    const ro = new ResizeObserver(() => {
      const cur = `${stage.clientWidth}x${stage.clientHeight}`;
      if (cur === last) return;
      clearTimeout(t);
      t = setTimeout(() => {
        last = cur;
        setLayoutKey((k) => k + 1);
      }, 250);
    });
    ro.observe(stage);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);

  const label = () => {
    if (!total) return '';
    const right = page + 1;
    const stage = stageRef.current;
    const two = stage && stage.clientWidth >= 700 && page > 1 && right <= total;
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
      <div className="flip-stage" ref={stageRef} />
      {status === 'ready' && (
        <div className="flip-bar">
          <button className="btn ghost sm" onClick={() => flipRef.current?.flip(0)}>⏮ Awal</button>
          <span className="flip-hint">Klik panah atau tarik sudut halaman untuk membalik</span>
          <button className="btn ghost sm" onClick={fullscreen}>⛶ Layar penuh</button>
          <button className="btn ghost sm" onClick={() => flipRef.current?.flip(total - 1)}>Akhir ⏭</button>
        </div>
      )}
    </div>
  );
}