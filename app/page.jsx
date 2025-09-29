export default function Page() {
  return (
    <main style={{minHeight:"100vh", display:"grid", placeItems:"center", background:"#0b0f19", color:"#eef2ff"}}>
      <div style={{maxWidth:720, width:"100%", padding:"24px"}}>
        <div style={{background:"#11162a", border:"1px solid #1f2947", borderRadius:16, padding:24}}>
          <h1 style={{margin:"0 0 8px"}}>DocXpress</h1>
          <p><strong>Documentos oficiais prontos em minutos, sem burocracia.</strong></p>
          <p style={{opacity:.8}}>MVP base no ar. Próximo passo: formulário de captura e Supabase.</p>
        </div>
      </div>
    </main>
  );
}
