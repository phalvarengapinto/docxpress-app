function fetchWithTimeout(url, options = {}, ms = 10000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  const opts = { ...options, signal: controller.signal };
  return fetch(url, opts).finally(() => clearTimeout(t));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const SUPABASE_URL   = process.env.SUPABASE_URL;
  const SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET; // pode estar vazio

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Env vars ausentes (SUPABASE)" });
  }

  try {
    const { email, source, recaptchaToken } = req.body || {};
    const isEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) return res.status(400).json({ ok: false, error: "Email inválido" });

    // 1) Valida reCAPTCHA (se configurado)
    if (RECAPTCHA_SECRET) {
      if (!recaptchaToken) return res.status(400).json({ ok: false, error: "reCAPTCHA ausente" });

      try {
        const verifyRes = await fetchWithTimeout(
          "https://www.google.com/recaptcha/api/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}`
          },
          8000 // 8s timeout no Google
        );
        const vjson = await verifyRes.json();
        if (!vjson.success) {
          return res.status(400).json({
            ok: false,
            error: "Falha no reCAPTCHA",
            recaptcha: { success: vjson.success, "error-codes": vjson["error-codes"] }
          });
        }
      } catch (e) {
        const msg = e?.name === "AbortError" ? "Timeout no reCAPTCHA" : "Erro ao validar reCAPTCHA";
        return res.status(504).json({ ok: false, error: msg });
      }
    }

    // 2) Checar duplicado
    try {
      const dupRes = await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&select=id`,
        { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } },
        8000 // 8s timeout no Supabase
      );
      if (!dupRes.ok) {
        const t = await dupRes.text();
        return res.status(502).json({ ok: false, error: "Falha ao verificar lead", details: t.slice(0, 600) });
      }
      const arr = await dupRes.json();
      if (Array.isArray(arr) && arr.length > 0) {
        return res.status(200).json({ ok: true, duplicated: true });
      }
    } catch (e) {
      const msg = e?.name === "AbortError" ? "Timeout ao verificar duplicado" : "Erro ao verificar duplicado";
      return res.stat
