import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // carrega o script do reCAPTCHA
  useEffect(() => {
    const id = "recaptcha-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://www.google.com/recaptcha/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  return (
    <main /* ...igual ao anterior... */>
      {/* ...conteúdo igual... */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setStatus("loading"); setError("");

              const form = e.currentTarget;
              const email = form.email.value;

              // 🔐 obter token do reCAPTCHA
              const token = window.grecaptcha?.getResponse();
              if (!token) {
                setStatus("error");
                setError("Por favor, marque o reCAPTCHA.");
                return;
              }

              const res = await fetch("/api/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "landing", recaptchaToken: token })
              });
              const json = await res.json();

              if (json.ok && json.duplicated) setStatus("dup");
              else if (json.ok) {
                setStatus("success");
                if (window.plausible) window.plausible("Lead", { props: { source: "landing" } });
                window.grecaptcha.reset(); // reseta checkbox
                setTimeout(() => { window.location.href = "/obrigado"; }, 1200);
              } else { setStatus("error"); setError(json.error || "tente novamente"); }

              form.reset();
            }}
            style={{marginTop:16,display:"flex",gap:8,flexWrap:"wrap"}}
          >
            <input /* ...igual... */ />
            <button /* ...igual... */>
              {status==="loading" ? "Enviando..." : "Entrar na lista"}
            </button>

            {/* ⬇️ widget reCAPTCHA */}
            <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} />
          </form>
      {/* ...restante igual... */}
    </main>
  );
}
