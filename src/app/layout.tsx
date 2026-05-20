import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ระบบบันทึกข้อมูลลูกค้า',
  description: 'ระบบบันทึกข้อมูลลูกค้าและงานซ่อมรถ'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
