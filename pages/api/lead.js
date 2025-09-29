// pages/api/lead.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET; // opcional

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Env vars ausentes (SUPABASE)" });
  }

  try {
    const { email, source, recaptchaToken } = req.body || {};

    // valida e-mail
    const isEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      return res.status(400).json({ ok: false, error: "Email inválido" });
    }

    // valida reCAPTCHA (se configurado)
    if (RECAPTCHA_SECRET) {
      if (!recaptchaToken) {
        return res.status(400).json({ ok: false, error: "reCAPTCHA ausente" });
      }
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}`
      });
      const vjson = await verifyRes.json();
      if (!vjson.success) {
        return res.status(400).json({
          ok: false,
          error: "Falha no reCAPTCHA",
          recaptcha: { success: vjson.success, "error-codes": vjson["error-codes"] }
        });
      }
    }

    // 1) checar duplicado
    const dupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&select=id`,
      { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } }
    );
    if (!dupRes.ok) {
      const t = await dupRes.text();
      return res.status(502).json({ ok: false, error: "Falha ao verificar lead", details: t.slice(0, 500) });
    }
    const existing = await dupRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(200).json({ ok: true, duplicated: true });
    }

    // 2) inserir
    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify([{ email, source: source ?? "landing" }])
    });
    if (!insRes.ok) {
      const t = await insRes.text();
      return res.status(502).json({ ok: false, error: "Não foi possível salvar seu e-mail", details: t.slice(0, 500) });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Erro inesperado" });
  }
}

