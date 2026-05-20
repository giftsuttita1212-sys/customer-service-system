# Customer Service System

เว็บระบบบันทึกข้อมูลลูกค้าและงานซ่อมรถ

## สิ่งที่ปรับในเวอร์ชันนี้

- ใช้ไอคอนเฟืองที่ผู้ใช้ส่งมาเป็น Web Icon และโลโก้ใน Sidebar
- ใช้ฟอนต์ Sarabun ผ่าน `next/font/google`
- ปรับหน้าตาให้มินิมอลขึ้น สีสว่าง สะอาด ใช้งานง่าย
- ยังคงเชื่อม Firebase ผ่าน Environment Variables ของ Vercel เหมือนเดิม

## การใช้งานกับ Vercel + Firebase

ต้องตั้งค่า Environment Variables ใน Vercel ให้ครบ 6 ตัวนี้:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

ถ้ายังไม่ใส่ค่า Firebase เว็บจะใช้โหมดทดลองและเก็บข้อมูลใน browser ชั่วคราว
