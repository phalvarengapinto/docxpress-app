import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { documentId } = req.body as { documentId: string };
    if (!documentId) return res.status(400).json({ error: 'documentId é obrigatório' });

    // Marca doc como "processing"
    await supabaseAdmin.from('documents').update({ status: 'processing' }).eq('id', documentId);

    // Cria extração "fake" concluída
    const extractionId = crypto.randomUUID();
    await supabaseAdmin.from('extractions').insert({
      id: extractionId,
      document_id: documentId,
      status: 'succeeded',
      data: {
        summary: 'Stub OCR: extração de exemplo',
        fields: [],
        text: 'Olá! O OCR real virá depois :)',
      },
    });

    // Marca doc como "done"
    await supabaseAdmin.from('documents').update({ status: 'done' }).eq('id', documentId);

    return res.status(200).json({ ok: true, extractionId });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? 'Erro inesperado' });
  }
}
