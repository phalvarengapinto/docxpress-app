export default function handler(req, res) {
  const hasUrl = !!process.env.SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  res.status(200).json({ ok: true, env: { SUPABASE_URL: hasUrl, SUPABASE_SERVICE_ROLE_KEY: hasKey }});
}
