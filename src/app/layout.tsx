import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'ระบบบันทึกข้อมูลลูกค้า',
  description: 'ระบบบันทึกข้อมูลลูกค้าและงานซ่อมรถ',
  icons: {
    icon: '/app-icon.png',
    shortcut: '/favicon.png',
    apple: '/app-icon.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={sarabun.className}>{children}</body>
    </html>
  );
}
