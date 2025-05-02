import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';   // service‑role client
import Papa from 'papaparse';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    /* ───── 0. grab the file ───── */
    const form = await req.formData();
    const file = form.get('file') as File | null;
    console.log('[upload] file present?', !!file);

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });
    }

    /* ───── 1. upload raw file to Storage ───── */
    const sb = createAdminClient();                // uses service‑role key
    const buf = Buffer.from(await file.arrayBuffer());
    const bucket = 'lead-uploads';
    const objectPath = `${randomUUID()}/${file.name}`;

    const { error: storeErr } = await sb.storage
      .from(bucket)
      .upload(objectPath, buf, { contentType: file.type || 'text/csv' });

    console.log('[upload] storage error:', storeErr);
    if (storeErr) {
      return NextResponse.json({ ok: false, error: storeErr.message }, { status: 500 });
    }

    /* ───── 2. parse CSV and bulk insert ───── */
    const { data: rows, errors } = Papa.parse<Record<string, any>>(buf.toString('utf8'), {
      header: true,
      skipEmptyLines: true
    });

    console.log('[upload] parsed rows:', rows.length, 'parse errors:', errors.length);
    if (errors.length) {
      return NextResponse.json({ ok: false, error: 'CSV parse errors', details: errors }, { status: 400 });
    }

    const { error: insertErr, count } = await sb
      .from('leads')
      .insert(rows as any[], { count: 'exact' });

    console.log('[upload] insert error:', insertErr, 'inserted:', count);
    if (insertErr) {
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    /* ───── 3. trigger normalization ───── */
    const { error: rpcErr } = await sb.rpc('normalize_staged_leads');
    console.log('[upload] rpc error:', rpcErr);

    return NextResponse.json({ ok: true, rows: count, normalized: !rpcErr });
  } catch (e: any) {
    console.error('[upload] fatal:', e);
    return NextResponse.json({ ok: false, error: e.message ?? 'Unexpected' }, { status: 500 });
  }
}