import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* Script do Plausible: carrega em todas as páginas */}
        <script
          defer
          data-domain="docxpress.tech"
          src="https://plausible.io/js/script.js"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
