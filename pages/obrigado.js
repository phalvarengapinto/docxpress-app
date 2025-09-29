export default function Obrigado() {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0b0f19",color:"#eef2ff",fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif"}}>
      <div style={{maxWidth:720,width:"100%",padding:"24px"}}>
        <div style={{background:"#11162a",border:"1px solid #1f2947",borderRadius:16,padding:24}}>
          <h1 style={{margin:"0 0 8px"}}>Obrigado! 🎉</h1>
          <p>Seu e-mail foi cadastrado com sucesso. Em breve entraremos em contato.</p>
          <a href="/" style={{display:"inline-block",marginTop:16,padding:"10px 14px",borderRadius:10,background:"#5b7bff",color:"#fff",textDecoration:"none"}}>Voltar à página inicial</a>
        </div>
      </div>
    </main>
  );
}
