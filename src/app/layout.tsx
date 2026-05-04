import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YOLO Connectors Game',
  description: 'Practise English connectors by sorting them into categories.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
