export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;                 // ex: https://xxxx.supabase.co
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;    // service_role (SECRETA)

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ ok: false, error: "Env vars ausentes" });
    }

    const { email, source } = req.body || {};
    const isEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) return res.status(400).json({ ok: false, error: "Email inválido" });

    // 1) Verificar duplicado
    const dup = await fetch(`${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&select=id`, {
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` }
    });
    if (!dup.ok) return res.status(500).json({ ok: false, error: "Erro ao verificar lead" });

    const arr = await dup.json();
    if (Array.isArray(arr) && arr.length > 0) {
      return res.status(200).json({ ok: true, duplicated: true });
    }

    // 2) Inserir
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify([{ email, source: source ?? "landing" }])
    });

    if (!ins.ok) {
      const txt = await ins.text();
      console.error("Supabase insert error:", ins.status, txt);
      return res.status(500).json({ ok: false, error: "Não foi possível salvar seu e-mail" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Erro inesperado" });
  }
}
