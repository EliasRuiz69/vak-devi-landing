import fs from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies – Vak Devi",
  description:
    "Política de Cookies de Vak Devi, consultoría de psicoterapia y desarrollo humano con sede en Mérida, Yucatán, México.",
};

export default function PoliticaDeCookies() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "politicas", "politica-de-cookies-vakdevi.html"),
    "utf8"
  );

  const styleContent = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? "";
  const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<style>${styleContent}</style>${bodyContent}`,
      }}
    />
  );
}
