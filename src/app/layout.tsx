import "./globals.css";

export const metadata = {
  title: "Meta SaaS",
  description: "Clean or edit metadata for images and videos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
