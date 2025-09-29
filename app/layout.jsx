export const metadata = {
  title: "DocXpress — Documentos oficiais em minutos",
  description: "Envie foto ou PDF; a IA extrai dados e gera o contrato pronto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
