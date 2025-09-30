import { useMemo, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseBrowser';
import axios from 'axios';
import * as tus from 'tus-js-client';

function getProjectRefFromUrl(url: string) {
  try {
    const host = new URL(url).host; // ex: abcd1234.supabase.co
    return host.split('.')[0];      // abcd1234
  } catch {
    return '';
  }
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const projectRef = useMemo(
    () => getProjectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    []
  );

  async function ensureAnonymousSession() {
    // Se já tem sessão, mantém; senão cria anônima (se Anonymous Sign-In estiver habilitado)
    const { data: g } = await supabase.auth.getSession();
    if (g?.session) return g.session;

    // Ignora erro se não estiver habilitado — o fallback usará Signed URL.
    try {
      const { data } = await supabase.auth.signInAnonymously();
      return data.session ?? null;
    } catch {
      return null;
    }
  }

  async function handleStart() {
    if (!file) return;
    setStatus('Preparando…'); setProgress(0);

    // 1) Registra no DB e pega token/paths
    const initRes = await fetch('/api/upload/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
    });
    const init = await initRes.json();
    if (!initRes.ok) { setStatus(`Erro: ${init.error}`); return; }

    const { documentId, bucket, storagePath, token, signedUrl } = init;

    // 2) Tenta TUS (progresso real). Se não tiver sessão, cai no fallback Axios PUT com Signed URL.
    const { data: g } = await supabase.auth.getSession();
    const session = g?.session ?? (await ensureAnonymousSession());

    if (session && projectRef) {
      setStatus('Enviando (TUS)…');
      const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;

      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: bucket,
          objectName: storagePath,      // caminho dentro do bucket
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,     // 6MB (recomendado)
        onProgress: (uploaded, total) => {
          setProgress(Math.round((uploaded / total) * 100));
        },
        onError: (err) => {
          console.error(err);
          setStatus('Falhou no TUS, tentando Signed URL…');
          // Fallback imediato via Signed URL (abaixo)
          upload.cancel();
          doSignedUrlUpload(documentId, signedUrl, token, file);
        },
        onSuccess: async () => {
          setStatus('Upload concluído! Iniciando OCR…');
          setProgress(100);
          await startOcr(documentId);
        },
      });

      upload.start();
      return;
    }

    // Fallback: Signed URL + Axios (com progresso)
    await doSignedUrlUpload(documentId, signedUrl, token, file);
  }

  async function doSignedUrlUpload(documentId: string, signedUrl: string | null, token: string, file: File) {
    try {
      setStatus('Enviando (Signed URL)…');
      // Se a lib não expõe a URL completa, use a API oficial com token:
      // await supabase.storage.from(bucket).uploadToSignedUrl(storagePath, token, file);
      // (Sem eventos de progresso). Para barra de progresso, preferimos PUT na signedUrl:
      if (!signedUrl) throw new Error('Signed URL não retornada pelo servidor');

      abortRef.current = new AbortController();

      await axios.put(signedUrl, file, {
        signal: abortRef.current.signal as any,
        headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
        onUploadProgress: (pe) => {
          if (!pe.total) return;
          setProgress(Math.round((pe.loaded / pe.total) * 100));
        },
        maxBodyLength: Infinity,
      });

      setStatus('Upload concluído! Iniciando OCR…');
      setProgress(100);
      await startOcr(documentId);
    } catch (e: any) {
      console.error(e);
      setStatus(`Erro no upload: ${e.message ?? e}`);
    }
  }

  async function startOcr(documentId: string) {
    const r = await fetch('/api/ocr/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    });
    const j = await r.json();
    if (!r.ok) { setStatus(`Erro no OCR: ${j.error}`); return; }
    setStatus(`OCR stub ok! extractionId=${j.extractionId}`);
  }

  return (
    <main style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1>Upload de Documento</h1>
      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div style={{ marginTop: 12 }}>
        <button onClick={handleStart} disabled={!file}>Enviar</button>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ height: 10, background: '#eee', borderRadius: 6 }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#6366f1',
              transition: 'width .2s',
              borderRadius: 6,
            }}
          />
        </div>
        <div style={{ marginTop: 8, color: '#555' }}>
          {status} {progress ? `(${progress}%)` : null}
        </div>
      </div>
    </main>
  );
}
