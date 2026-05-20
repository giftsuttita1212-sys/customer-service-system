'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '@/lib/firebase';

type Customer = {
  id?: string;
  serviceDate: string;
  plate: string;
  brand: string;
  model: string;
  customerName: string;
  phone: string;
  repairDetail: string;
  warranty: string;
  price: string;
  billImage: string;
  carFrontImage: string;
  repairImage: string;
  status: string;
  createdAt?: unknown;
};

const emptyForm: Customer = {
  serviceDate: '',
  plate: '',
  brand: '',
  model: '',
  customerName: '',
  phone: '',
  repairDetail: '',
  warranty: '',
  price: '',
  billImage: '',
  carFrontImage: '',
  repairImage: '',
  status: 'รอตรวจสอบ'
};

const sampleCustomers: Customer[] = [
  { id: 'demo-1', serviceDate: '2026-05-20', plate: 'กก 1234', brand: 'Toyota', model: 'Fortuner 2.4 V', customerName: 'บริษัท เอ็มเอส เซอร์วิส จำกัด', phone: '081-234-5678', repairDetail: 'เปลี่ยนผ้าเบรกหน้า-หลัง, เปลี่ยนน้ำมันเครื่อง', warranty: '6 เดือน', price: '12500', billImage: '', carFrontImage: '', repairImage: '', status: 'เสร็จสิ้น' },
  { id: 'demo-2', serviceDate: '2026-05-19', plate: 'ขข 5678', brand: 'Isuzu', model: 'D-Max 1.9 Z', customerName: 'หจก. เค.ที. อะไหล่ยนต์', phone: '089-876-5432', repairDetail: 'เปลี่ยนชุดคลัตช์, เช็กระบบช่วงล่าง', warranty: '10,000 กม.', price: '18900', billImage: '', carFrontImage: '', repairImage: '', status: 'กำลังดำเนินการ' }
];

export default function Home() {
  const [page, setPage] = useState<'form' | 'list'>('form');
  const [form, setForm] = useState<Customer>(emptyForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    try {
      if (isFirebaseReady && db) {
        const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setCustomers(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Customer) })));
      } else {
        const saved = localStorage.getItem('customers-demo');
        setCustomers(saved ? JSON.parse(saved) : sampleCustomers);
      }
    } catch (error) {
      console.error(error);
      alert('โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Firebase Rules หรือ Environment Variables');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function updateField(field: keyof Customer, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = { ...form, createdAt: serverTimestamp() };

      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'customers'), payload);
      } else {
        const saved = localStorage.getItem('customers-demo');
        const current: Customer[] = saved ? JSON.parse(saved) : sampleCustomers;
        localStorage.setItem('customers-demo', JSON.stringify([{ ...form, id: String(Date.now()) }, ...current]));
      }

      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      setForm(emptyForm);
      await loadCustomers();
    } catch (error) {
      console.error(error);
      alert('บันทึกไม่สำเร็จ กรุณาตรวจสอบ Firebase Rules หรือ Environment Variables');
    } finally {
      setLoading(false);
    }
  }

  async function removeCustomer(customer: Customer) {
    const ok = confirm(`ต้องการลบข้อมูลทะเบียน ${customer.plate} ใช่ไหม?`);
    if (!ok) return;

    try {
      if (isFirebaseReady && db && customer.id && !customer.id.startsWith('demo-')) {
        await deleteDoc(doc(db, 'customers', customer.id));
      } else {
        const next = customers.filter((item) => item.id !== customer.id);
        localStorage.setItem('customers-demo', JSON.stringify(next));
      }
      await loadCustomers();
    } catch (error) {
      console.error(error);
      alert('ลบข้อมูลไม่สำเร็จ');
    }
  }

  const filteredCustomers = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) return customers;
    return customers.filter((item) =>
      [item.plate, item.customerName, item.phone, item.brand, item.model, item.repairDetail]
        .join(' ')
        .toLowerCase()
        .includes(text)
    );
  }, [customers, keyword]);

  const doneCount = customers.filter((item) => item.status === 'เสร็จสิ้น').length;
  const waitingCount = customers.filter((item) => item.status !== 'เสร็จสิ้น').length;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">ระบบบันทึกข้อมูลลูกค้า</div>
        <button className={`menu ${page === 'form' ? 'active' : ''}`} onClick={() => setPage('form')}>บันทึกข้อมูลลูกค้า</button>
        <button className={`menu ${page === 'list' ? 'active' : ''}`} onClick={() => { setPage('list'); loadCustomers(); }}>รายการทั้งหมด</button>
      </aside>

      <main className="main">
        <div className="topline">
          <div>
            <h1>{page === 'form' ? 'ระบบบันทึกข้อมูลลูกค้า' : 'รายการข้อมูลลูกค้า'}</h1>
            <p className="subtitle">{page === 'form' ? 'สำหรับเก็บข้อมูลการเข้ารับบริการและงานซ่อม' : 'รายการที่บันทึกไว้ทั้งหมดสำหรับค้นหาและจัดการข้อมูล'}</p>
          </div>
          {!isFirebaseReady && <div className="status-note">โหมดทดลอง: ยังไม่ได้ใส่ค่า Firebase ระบบจะเก็บข้อมูลในเครื่องชั่วคราว</div>}
        </div>

        {page === 'form' && (
          <form className="card" onSubmit={submitForm}>
            <div className="grid">
              <div><label>วันที่</label><input type="date" value={form.serviceDate} onChange={(e) => updateField('serviceDate', e.target.value)} required /></div>
              <div><label>ทะเบียนรถ</label><input value={form.plate} onChange={(e) => updateField('plate', e.target.value)} placeholder="เช่น กก 1234" required /></div>
              <div><label>ยี่ห้อรถ</label><input value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="เช่น Toyota" /></div>
              <div><label>รุ่นรถ</label><input value={form.model} onChange={(e) => updateField('model', e.target.value)} placeholder="เช่น Fortuner 2.4 V" /></div>
              <div className="full"><label>ชื่อผู้เข้าใช้บริการ / ชื่อบริษัท / ชื่อบุคคล</label><input value={form.customerName} onChange={(e) => updateField('customerName', e.target.value)} required /></div>
              <div><label>เบอร์ติดต่อ</label><input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="081-234-5678" /></div>
              <div><label>การรับประกัน</label><input value={form.warranty} onChange={(e) => updateField('warranty', e.target.value)} placeholder="เช่น 6 เดือน หรือ 10,000 กม." /></div>
              <div className="full"><label>รายละเอียดการซ่อม</label><textarea value={form.repairDetail} onChange={(e) => updateField('repairDetail', e.target.value)} placeholder="ระบุรายละเอียดงานซ่อม" /></div>
              <div><label>ราคา</label><input type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="12500" /></div>
              <div><label>สถานะ</label><select value={form.status} onChange={(e) => updateField('status', e.target.value)}><option>รอตรวจสอบ</option><option>กำลังดำเนินการ</option><option>เสร็จสิ้น</option></select></div>
              <div><label>ลิงก์รูปบิล</label><input value={form.billImage} onChange={(e) => updateField('billImage', e.target.value)} placeholder="https://..." /></div>
              <div><label>ลิงก์หน้ารถ</label><input value={form.carFrontImage} onChange={(e) => updateField('carFrontImage', e.target.value)} placeholder="https://..." /></div>
              <div className="full"><label>ลิงก์รูปส่วนที่ต้องซ่อม</label><input value={form.repairImage} onChange={(e) => updateField('repairImage', e.target.value)} placeholder="https://..." /></div>
            </div>
            <div className="actions"><button className="btn primary" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button><button type="button" className="btn secondary" onClick={() => setForm(emptyForm)}>ล้างข้อมูล</button></div>
          </form>
        )}

        {page === 'list' && (
          <>
            <div className="summary">
              <div className="summary-card"><span>รายการทั้งหมด</span><strong>{customers.length}</strong></div>
              <div className="summary-card"><span>เสร็จสิ้น</span><strong>{doneCount}</strong></div>
              <div className="summary-card"><span>รอดำเนินการ</span><strong>{waitingCount}</strong></div>
            </div>
            <div className="card search-card">
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ค้นหาทะเบียนรถ / ชื่อลูกค้า / เบอร์โทร" />
              <button className="btn primary" onClick={loadCustomers}>รีเฟรช</button>
              <button className="btn secondary" onClick={() => setPage('form')}>เพิ่มรายการใหม่</button>
            </div>
            <div className="card table-card">
              <table>
                <thead><tr><th>วันที่</th><th>ทะเบียนรถ</th><th>ยี่ห้อ / รุ่นรถ</th><th>ชื่อลูกค้า / บริษัท</th><th>เบอร์ติดต่อ</th><th>รายละเอียดการซ่อม</th><th>รับประกัน</th><th>ราคา</th><th>รูปภาพ</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {filteredCustomers.length === 0 && <tr><td colSpan={11} className="empty">ยังไม่มีข้อมูล</td></tr>}
                  {filteredCustomers.map((item) => (
                    <tr key={item.id}>
                      <td>{formatThaiDate(item.serviceDate)}</td>
                      <td>{item.plate}</td>
                      <td>{item.brand} {item.model}</td>
                      <td>{item.customerName}</td>
                      <td>{item.phone}</td>
                      <td className="repair-cell">{item.repairDetail}</td>
                      <td>{item.warranty}</td>
                      <td>{formatPrice(item.price)}</td>
                      <td className="image-links">{renderLinks(item)}</td>
                      <td><span className={`badge ${item.status === 'กำลังดำเนินการ' ? 'progress' : item.status === 'รอตรวจสอบ' ? 'wait' : ''}`}>{item.status}</span></td>
                      <td><div className="row-actions"><button className="small-btn secondary" onClick={() => alert(JSON.stringify(item, null, 2))}>ดู</button><button className="small-btn danger" onClick={() => removeCustomer(item)}>ลบ</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function renderLinks(item: Customer) {
  const links = [
    { label: 'บิล', url: item.billImage },
    { label: 'หน้ารถ', url: item.carFrontImage },
    { label: 'จุดซ่อม', url: item.repairImage }
  ].filter((link) => link.url);

  if (links.length === 0) return '-';
  return links.map((link) => <a key={link.label} href={link.url} target="_blank">{link.label}</a>);
}

function formatThaiDate(dateText: string) {
  if (!dateText) return '-';
  return new Date(dateText).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatPrice(price: string) {
  if (!price) return '-';
  return Number(price).toLocaleString('th-TH') + ' บาท';
}
