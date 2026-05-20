# ระบบบันทึกข้อมูลลูกค้า

เว็บ Next.js สำหรับบันทึกข้อมูลลูกค้าและงานซ่อมรถ พร้อม deploy บน Vercel และเชื่อม Firebase Firestore ได้

## วิธีใช้งานแบบเร็ว

1. อัปโหลดโฟลเดอร์นี้ขึ้น GitHub
2. Import repository เข้า Vercel
3. เพิ่ม Environment Variables ของ Firebase ใน Vercel
4. Deploy

## Environment Variables ที่ต้องตั้งใน Vercel

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

## Firestore Collection

ระบบจะใช้ collection ชื่อ `customers`

## หมายเหตุ

ถ้ายังไม่ได้ใส่ Firebase env ระบบจะทำงานแบบ Local Demo โดยเก็บข้อมูลไว้ใน browser localStorage ชั่วคราว
