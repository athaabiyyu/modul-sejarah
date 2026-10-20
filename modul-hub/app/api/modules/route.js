import { NextResponse } from 'next/server';
import { getModules, addModule, deleteModule, storageReady } from '@/lib/modules';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!storageReady()) {
    return NextResponse.json({ modules: [], storageReady: false });
  }
  const modules = await getModules();
  return NextResponse.json({ modules, storageReady: true });
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.url) {
      return NextResponse.json({ error: 'url wajib diisi' }, { status: 400 });
    }
    const item = await addModule(data);
    return NextResponse.json({ module: item });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
  try {
    const ok = await deleteModule(id);
    return NextResponse.json({ ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
