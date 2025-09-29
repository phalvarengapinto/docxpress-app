export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0f19",
        color: "#eef2ff",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, width: "100%", padding: "24px" }}>
        <div
          style={{
            background: "#11162a",
            border: "1px solid #1f2947",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h1 style={{ margin: "0 0 8px" }}>DocXpress</h1>
          <p>
            <strong>
              Documentos oficiais prontos em minutos, sem burocracia.
            </strong>
          </p>

          {/* Formulário */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const email = form.email.value;

              const res = await fetch("/api/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "landing" }),
              });

              const json = await res.json();
              alert(
                json.ok
                  ? json.duplicated
                    ? "Você já está na lista. Obrigado!"
                    : "Obrigado! Você entrou na lista."
                  : "Erro: " + (json.error ?? "tente novamente")
              );

              form.reset();
            }}
            style={{ marginTop: 16, display: "flex", gap: 8 }}
          >
            <input
              type="email"
              name="email"
              placeholder="Seu e-mail"
              required
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #2b355c",
                background: "#0f1530",
                color: "#eef2ff",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "none",
                background: "#5b7bff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Entrar na lista
            </button>
          </form>

          <p style={{ opacity: 0.7, fontSize: 12, marginTop: 16 }}>
            © DocXpress — docxpress.tech
          </p>
        </div>
      </div>
    </main>
  );
}
