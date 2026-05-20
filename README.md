# ระบบบันทึกข้อมูลลูกค้า

เวอร์ชันนี้ปรับใหม่ตามคำขอ:

- ใช้ไอคอนเฟืองเป็น favicon และ logo
- ใช้ฟอนต์ Sarabun
- หน้าตามินิมอล
- เชื่อม Firebase config ในโค้ดโดยตรง
- ใช้ Firebase Firestore เป็นฐานข้อมูลออนไลน์
- เปลี่ยน alert/confirm ของ Browser เป็น Toast และ Modal ในหน้าเว็บ

## วิธีอัปโหลดขึ้น GitHub

1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์ `customer-service-system`
3. อัปโหลดไฟล์ทั้งหมดข้างในโฟลเดอร์นี้ทับไฟล์เดิมใน GitHub
4. Commit changes
5. รอ Vercel Deploy ใหม่
6. เปิดเว็บแล้วกด Ctrl + F5

## Firestore Rules สำหรับทดสอบ

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /customers/{document} {
      allow read, write: if true;
    }
  }
}
```

หมายเหตุ: Rules นี้ใช้สำหรับทดสอบเท่านั้น ก่อนใช้งานจริงควรเพิ่มระบบล็อกอินและปรับ Rules ให้ปลอดภัยกว่าเดิม
