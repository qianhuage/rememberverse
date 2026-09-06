import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Rememberverse — A little island. A lifetime of love.',
  description:
    'Create a peaceful memorial island from photos and memories of the people and pets you love.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
