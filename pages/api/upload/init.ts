import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileName, mimeType, size } = req.body as {
      fileName: string; mimeType: string; size: number;
    };

    if (!fileName || !mimeType || !size) {
      return res.status(400).json({ error: 'fileName, mimeType e size são obrigatórios' });
    }

    const id = crypto.randomUUID();
    const safeName = fileName.replace(/[^\w.\-]+/g, '_');
    const bucket = 'uploads';
    const storagePath = `${id}/${safeName}`;

    // 1) Cria a linha em documents
    const { error: insertErr } = await supabaseAdmin
      .from('documents')
      .insert({
        id,
        original_name: fileName,
        mime_type: mimeType,
        size,
        bucket,
        storage_path: storagePath,
        status: 'uploading',
      });

    if (insertErr) throw insertErr;

    // 2) Gera Signed Upload URL (útil se você quiser subir sem auth e ainda ter progresso via XHR)
    const { data: signed, error: signErr } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (signErr) throw signErr;

    // Retorno inclui o token do upload assinado e dados pro modo TUS
    return res.status(200).json({
      documentId: id,
      bucket,
      storagePath,
      // createSignedUploadUrl -> token (e geralmente signedUrl/path)
      token: (signed as any).token,
      signedUrl: (signed as any).signedUrl ?? null,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? 'Erro inesperado' });
  }
}
