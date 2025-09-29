import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | dup | error
  const [error, setError] = useState("");

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0b0f19",color:"#eef2ff",fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif"}}>
      <div style={{maxWidth:720,width:"100%",padding:"24px"}}>
        <div style={{background:"#11162a",border:"1px solid #1f2947",borderRadius:16,padding:24}}>
          <h1 style={{margin:"0 0 8px"}}>DocXpress</h1>
          <p><strong>Documentos oficiais prontos em minutos, sem burocracia.</strong></p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setStatus("loading");
              setError("");

              const form = e.currentTarget;
              const email = form.email.value;

              const res = await fetch("/api/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "landing" })
              });

              const json = await res.json();

              if (json.ok && json.duplicated) {
                setStatus("dup");
              } else if (json.ok) {
                setStatus("success");
                // evento analytics (Plausible) – será ativado no passo 3
                if (typeof window !== "undefined" && window.plausible) {
                  window.plausible("Lead", { props: { source: "landing" } });
                }
                // redireciona após 1.5s
                setTimeout(() => { window.location.href = "/obrigado"; }, 1500);
              } else {
                setStatus("error");
                setError(json.error || "tente novamente");
              }

              form.reset();
            }}
            style={{marginTop:16,display:"flex",gap:8}}
          >
            <input type="email" name="email" placeholder="Seu e-mail" required
              style={{flex:1,padding:"12px 14px",borderRadius:10,border:"1px solid #2b355c",background:"#0f1530",color:"#eef2ff"}} />
            <button type="submit" disabled={status==="loading"}
              style={{padding:"12px 14px",borderRadius:10,border:"none",background:"#5b7bff",color:"#fff",cursor:"pointer",opacity:status==="loading"?0.7:1}}>
              {status==="loading" ? "Enviando..." : "Entrar na lista"}
            </button>
          </form>

          {/* mensagens amigáveis */}
          {status==="success" && <p style={{marginTop:12,color:"#8cffc1"}}>Tudo certo! Redirecionando…</p>}
          {status==="dup" && <p style={{marginTop:12,color:"#ffe28c"}}>Você já está na lista. Obrigado!</p>}
          {status==="error" && <p style={{marginTop:12,color:"#ff8c8c"}}>Erro: {error}</p>}

          <p style={{opacity:.7,fontSize:12,marginTop:16}}>© DocXpress — docxpress.tech</p>
        </div>
      </div>
    </main>
  );
}
