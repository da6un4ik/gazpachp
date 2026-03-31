import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gazpachp Starter',
  description: 'Minimalist Next.js 14 starter in Apple-like style'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
