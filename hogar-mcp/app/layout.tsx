import type { ReactNode } from "react";

export const metadata = { title: "hogar-mcp" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "3rem auto", maxWidth: 560, padding: "0 1rem" }}>
        {children}
      </body>
    </html>
  );
}
