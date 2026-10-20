import Library from '@/components/Library';
import { getModules, storageReady } from '@/lib/modules';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const ready = storageReady();
  let modules = [];
  let failed = false;
  if (ready) {
    try {
      modules = await getModules();
    } catch {
      failed = true;
    }
  }

  return (
    <main>
      <header className="site-header">
        <div className="container">
          <span className="badge">PERPUSTAKAAN MODUL</span>
          <h1>Modul Hub</h1>
          <p>Kumpulan modul dan dokumen pembelajaran. Klik untuk membaca langsung.</p>
        </div>
      </header>
      {!ready && (
        <div className="container">
          <div className="notice warn" style={{ marginTop: 20 }}>
            Penyimpanan belum disiapkan (BLOB_READ_WRITE_TOKEN belum diatur).
          </div>
        </div>
      )}
      {failed && (
        <div className="container">
          <div className="notice err" style={{ marginTop: 20 }}>Gagal memuat daftar modul. Coba muat ulang.</div>
        </div>
      )}
      <Library modules={modules} />
    </main>
  );
}
