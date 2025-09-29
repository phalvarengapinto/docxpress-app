import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email, source } = await req.json();

    // validação simples
    const isEmail = typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
    }

    // checar duplicados
    const { data: existing, error: findErr } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (findErr) {
      console.error(findErr);
      return NextResponse.json({ ok: false, error: "Erro ao verificar lead" }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ ok: true, duplicated: true });
    }

    // inserir
    const { error } = await supabase
      .from("leads")
      .insert({ email, source: source ?? "landing" });

    if (error) {
      console.error(error);
      return NextResponse.json({ ok: false, error: "Não foi possível salvar seu e-mail" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Erro inesperado" }, { status: 500 });
  }
}
