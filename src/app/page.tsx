'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';
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

type Toast = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
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
  {
    id: 'demo-1',
    serviceDate: '2026-05-20',
    plate: 'กก 1234',
    brand: 'Toyota',
    model: 'Fortuner 2.4 V',
    customerName: 'บริษัท เอ็มเอส เซอร์วิส จำกัด',
    phone: '081-234-5678',
    repairDetail: 'เปลี่ยนผ้าเบรกหน้า-หลัง, เปลี่ยนน้ำมันเครื่อง',
    warranty: '6 เดือน',
    price: '12500',
    billImage: '',
    carFrontImage: '',
    repairImage: '',
    status: 'เสร็จสิ้น'
  },
  {
    id: 'demo-2',
    serviceDate: '2026-05-19',
    plate: 'ขข 5678',
    brand: 'Isuzu',
    model: 'D-Max 1.9 Z',
    customerName: 'หจก. เค.ที. อะไหล่ยนต์',
    phone: '089-876-5432',
    repairDetail: 'เปลี่ยนชุดคลัตช์, เช็กระบบช่วงล่าง',
    warranty: '10,000 กม.',
    price: '18900',
    billImage: '',
    carFrontImage: '',
    repairImage: '',
    status: 'กำลังดำเนินการ'
  }
];

export default function Home() {
  const [page, setPage] = useState<'form' | 'list'>('form');
  const [form, setForm] = useState<Customer>(emptyForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  function showToast(nextToast: Toast) {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 3600);
  }

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
      showToast({
        type: 'error',
        title: 'โหลดข้อมูลไม่สำเร็จ',
        message: 'กรุณาตรวจสอบว่าเปิด Firestore และตั้ง Rules แล้ว'
      });
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
    setSaving(true);

    try {
      const payload = { ...form, createdAt: serverTimestamp() };

      if (isFirebaseReady && db) {
        await addDoc(collection(db, 'customers'), payload);
      } else {
        const saved = localStorage.getItem('customers-demo');
        const current: Customer[] = saved ? JSON.parse(saved) : sampleCustomers;
        localStorage.setItem(
          'customers-demo',
          JSON.stringify([{ ...form, id: String(Date.now()) }, ...current])
        );
      }

      setForm(emptyForm);
      showToast({ type: 'success', title: 'บันทึกข้อมูลเรียบร้อยแล้ว', message: 'ข้อมูลถูกบันทึกเข้า Firebase แล้ว' });
      await loadCustomers();
    } catch (error) {
      console.error(error);
      showToast({
        type: 'error',
        title: 'บันทึกไม่สำเร็จ',
        message: 'กรุณาตรวจสอบ Firestore Rules หรืออินเทอร์เน็ต'
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (isFirebaseReady && db && deleteTarget.id && !deleteTarget.id.startsWith('demo-')) {
        await deleteDoc(doc(db, 'customers', deleteTarget.id));
      } else {
        const next = customers.filter((item) => item.id !== deleteTarget.id);
        localStorage.setItem('customers-demo', JSON.stringify(next));
      }

      setDeleteTarget(null);
      showToast({ type: 'success', title: 'ลบข้อมูลเรียบร้อยแล้ว' });
      await loadCustomers();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'ลบข้อมูลไม่สำเร็จ', message: 'กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setDeleting(false);
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
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-icon">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : 'i'}</div>
          <div>
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>
          <button aria-label="ปิดแจ้งเตือน" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {(saving || loading || deleting) && (
        <div className="mini-loading">
          <span className="spinner" />
          {saving ? 'กำลังบันทึกข้อมูล...' : deleting ? 'กำลังลบข้อมูล...' : 'กำลังโหลดข้อมูล...'}
        </div>
      )}

      <aside className="sidebar">
        <div className="logo">
          <img src="/app-icon.png" alt="ไอคอนระบบ" />
          <div className="logo-text">
            <span className="logo-title">ประวัติการเข้าใช้บริการของลูกค้า</span>
            <small>Record of service access</small>
          </div>
        </div>
        <button className={`menu ${page === 'form' ? 'active' : ''}`} onClick={() => setPage('form')}>＋ บันทึกข้อมูลลูกค้า</button>
        <button className={`menu ${page === 'list' ? 'active' : ''}`} onClick={() => { setPage('list'); loadCustomers(); }}>☰ รายการทั้งหมด</button>
      </aside>

      <main className="main">
        <div className="topline">
          <div>
            <h1>{page === 'form' ? 'ประวัติการเข้าใช้บริการของลูกค้า' : 'รายการข้อมูลลูกค้า'}</h1>
            <p className="subtitle">{page === 'form' ? 'สำหรับเก็บข้อมูลการเข้ารับบริการและงานซ่อม' : 'รายการที่บันทึกไว้ทั้งหมดสำหรับค้นหาและจัดการข้อมูล'}</p>
          </div>
          <div className="status-ready">เชื่อมต่อ Firebase แล้ว</div>
        </div>

        {page === 'form' && (
          <form className="card" onSubmit={submitForm}>
            <div className="section-heading">
              <div>
                <strong>ข้อมูลการเข้ารับบริการ</strong>
                <span>กรอกข้อมูลให้ครบถ้วนเพื่อเก็บเป็นประวัติลูกค้า</span>
              </div>
            </div>

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
            <div className="actions">
              <button className="btn primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
              <button type="button" className="btn secondary" onClick={() => setForm(emptyForm)} disabled={saving}>ล้างข้อมูล</button>
            </div>
          </form>
        )}

        {page === 'list' && (
          <>
            <div className="summary">
              <div className="summary-card"><span>รายการทั้งหมด</span><strong>{customers.length}</strong></div>
              <div className="summary-card"><span>เสร็จสิ้น</span><strong>{doneCount}</strong></div>
              <div className="summary-card"><span>รอดำเนินการ</span><strong>{waitingCount}</strong></div>
            </div>
            <div className="card search-card list-sticky-bar">
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ค้นหาทะเบียนรถ / ชื่อลูกค้า / เบอร์โทร" />
              <button className="btn primary" onClick={loadCustomers} disabled={loading}>รีเฟรช</button>
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
                      <td>
                        <div className="row-actions">
                          <button className="small-btn secondary" onClick={() => setViewing(item)}>ดู</button>
                          <button className="small-btn danger" onClick={() => setDeleteTarget(item)}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {viewing && (
        <div className="modal-backdrop">
          <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-kicker">รายละเอียดรายการ</span>
                <h2>{viewing.plate || 'ไม่ระบุทะเบียน'}</h2>
              </div>
              <button className="close-btn" onClick={() => setViewing(null)}>×</button>
            </div>
            <div className="detail-grid">
              <Detail label="วันที่" value={formatThaiDate(viewing.serviceDate)} />
              <Detail label="รถ" value={`${viewing.brand || '-'} ${viewing.model || ''}`} />
              <Detail label="ลูกค้า / บริษัท" value={viewing.customerName || '-'} />
              <Detail label="เบอร์ติดต่อ" value={viewing.phone || '-'} />
              <Detail label="การรับประกัน" value={viewing.warranty || '-'} />
              <Detail label="ราคา" value={formatPrice(viewing.price)} />
              <Detail label="สถานะ" value={viewing.status || '-'} />
              <Detail label="รายละเอียดการซ่อม" value={viewing.repairDetail || '-'} wide />
            </div>
            <div className="modal-links">
              {renderModalLinks(viewing)}
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <h2>ยืนยันการลบข้อมูล</h2>
            <p>ต้องการลบข้อมูลทะเบียน <strong>{deleteTarget.plate}</strong> ใช่ไหม? การลบแล้วไม่สามารถย้อนกลับได้</p>
            <div className="confirm-actions">
              <button className="btn secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>ยกเลิก</button>
              <button className="btn danger-solid" onClick={confirmDelete} disabled={deleting}>{deleting ? 'กำลังลบ...' : 'ลบข้อมูล'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`detail-item ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
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
  return links.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>);
}

function renderModalLinks(item: Customer) {
  const links = [
    { label: 'เปิดรูปบิล', url: item.billImage },
    { label: 'เปิดรูปหน้ารถ', url: item.carFrontImage },
    { label: 'เปิดรูปส่วนที่ต้องซ่อม', url: item.repairImage }
  ].filter((link) => link.url);

  if (links.length === 0) return <span className="no-links">ไม่มีลิงก์รูปภาพ</span>;
  return links.map((link) => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>);
}

function formatThaiDate(dateText: string) {
  if (!dateText) return '-';
  return new Date(dateText).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatPrice(price: string) {
  if (!price) return '-';
  return Number(price).toLocaleString('th-TH') + ' บาท';
}
