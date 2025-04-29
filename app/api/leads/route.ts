import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const config = {
  api: { bodyParser: false },
};

export async function POST(request: NextRequest) {
  console.log('[API /leads] POST handler called');
  try {
    const formData = await request.formData();
    const fileField = formData.get('file');
    console.log('[API /leads] formData file:', fileField);
    if (!(fileField instanceof File)) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }
    const file = fileField;
    const fileName = `${crypto.randomUUID()}_${file.name}`;
    // Upload file using upsert:false so existing files cause a duplicate error
    const admin = createAdminClient();
    console.log('[API /leads] uploading file:', fileName);
    const { error: storageError } = await admin.storage
      .from('lead-imports')
      .upload(fileName, file, { contentType: file.type, upsert: false });
    console.log('[API /leads] storage upload error:', storageError);
    if (storageError) {
      return NextResponse.json({ success: false, message: storageError.message }, { status: 500 });
    }
    const { error: dbError } = await admin
      .from('lead_sources')
      .insert({
        name: fileName,
        file_name: file.name,
        last_imported: new Date().toISOString(),
        record_count: 0,
        is_active: true,
      });
    console.log('[API /leads] DB insert error:', dbError);
    if (dbError) {
      return NextResponse.json({ success: false, message: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /leads] unexpected error:', err);
    return NextResponse.json({ success: false, message: 'Unexpected server error' }, { status: 500 });
  }
}