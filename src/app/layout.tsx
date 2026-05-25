import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { StoreProvider } from "@/context/store-context";

export const metadata: Metadata = {
  title: "Mobilnik.KG — Магазин Мобильных Телефонов",
  description: "Оригинальные девайсы по лучшим оптовым и розничным ценам в Бишкеке.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>
          <StoreProvider>{children}</StoreProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
