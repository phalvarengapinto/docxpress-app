<form
  onSubmit={async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.email.value;
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "landing" })
    });
    const json = await res.json();
    alert(json.ok
      ? (json.duplicated ? "Você já está na lista. Obrigado!" : "Obrigado! Você entrou na lista.")
      : "Erro: " + (json.error ?? "tente novamente"));
    form.reset();
  }}
  style={{ marginTop: 16, display: "flex", gap: 8 }}
>
  <input
    type="email"
    name="email"
    placeholder="Seu e-mail"
    required
    style={{ flex: 1, padding: "12px 14px", borderRadius: 10 }}
  />
  <button
    type="submit"
    style={{ padding: "12px 14px", borderRadius: 10, background: "#5b7bff", color: "#fff", border: "none", cursor: "pointer" }}
  >
    Entrar na lista
  </button>
</form>
