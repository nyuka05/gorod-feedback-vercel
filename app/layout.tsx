import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3002";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: "Финал · Школа городских продюсеров",
    description: "Поддержите коллег: оставьте тёплое сообщение и поставьте лайки выступлению.",
    openGraph: {
      title: "Поддержите тех, кто делает город живым",
      description: "Площадка обратной связи для финальных питчингов Школы городских продюсеров.",
      type: "website",
      locale: "ru_RU",
      images: [{ url: "/og-feedback.png", width: 1536, height: 1024, alt: "Участники делятся поддержкой после финальных питчингов" }],
    },
    twitter: { card: "summary_large_image", images: ["/og-feedback.png"] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
