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
  serverTimestamp,
  updateDoc
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
  updatedAt?: unknown;
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

const DRAFT_KEY = 'customer-form-draft';

export default function Home() {
  const [page, setPage] = useState<'form' | 'list'>('form');
  const [form, setForm] = useState<Customer>(emptyForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<Customer>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmLeaveForm, setConfirmLeaveForm] = useState<'list' | null>(null);
  const [confirmClearForm, setConfirmClearForm] = useState(false);
  const [confirmCloseEdit, setConfirmCloseEdit] = useState(false);

  const formDirty = useMemo(() => !isCustomerFormEmpty(form), [form]);
  const editDirty = useMemo(() => {
    if (!editing) return false;
    return JSON.stringify(getEditableCustomer(editForm)) !== JSON.stringify(getEditableCustomer(editing));
  }, [editForm, editing]);

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

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as Customer;
        if (!isCustomerFormEmpty(parsed)) {
          setForm({ ...emptyForm, ...parsed });
          showToast({
            type: 'info',
            title: 'กู้คืนข้อมูลร่างล่าสุดแล้ว',
            message: 'ระบบเก็บข้อมูลที่ยังไม่ได้บันทึกไว้ให้อัตโนมัติ'
          });
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (isCustomerFormEmpty(form)) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!formDirty && !editDirty) return;
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [formDirty, editDirty]);

  function goToPage(nextPage: 'form' | 'list') {
    if (page === 'form' && nextPage === 'list' && formDirty) {
      setConfirmLeaveForm('list');
      return;
    }

    setPage(nextPage);
    if (nextPage === 'list') loadCustomers();
  }

  function updateField(field: keyof Customer, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditField(field: keyof Customer, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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
        localStorage.setItem('customers-demo', JSON.stringify([{ ...form, id: String(Date.now()) }, ...current]));
      }

      setForm(emptyForm);
      localStorage.removeItem(DRAFT_KEY);
      showToast({ type: 'success', title: 'บันทึกข้อมูลเรียบร้อยแล้ว', message: 'ข้อมูลถูกบันทึกและร่างข้อมูลถูกล้างแล้ว' });
      await loadCustomers();
    } catch (error) {
      console.error(error);
      showToast({
        type: 'error',
        title: 'บันทึกไม่สำเร็จ',
        message: 'ข้อมูลที่กรอกไว้ยังอยู่ในฟอร์มและถูกเก็บเป็นร่างไว้แล้ว'
      });
    } finally {
      setSaving(false);
    }
  }

  function openEdit(item: Customer) {
    setViewing(null);
    setEditForm({ ...emptyForm, ...item });
    setEditing(item);
  }

  function requestCloseEdit() {
    if (editDirty) {
      setConfirmCloseEdit(true);
      return;
    }
    setEditing(null);
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);

    try {
      const payload = getEditableCustomer(editForm);

      if (isFirebaseReady && db && editing.id && !editing.id.startsWith('demo-')) {
        await updateDoc(doc(db, 'customers', editing.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
      } else {
        const next = customers.map((item) =>
          item.id === editing.id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item
        );
        localStorage.setItem('customers-demo', JSON.stringify(next));
        setCustomers(next);
      }

      setEditing(null);
      setEditForm(emptyForm);
      showToast({ type: 'success', title: 'แก้ไขข้อมูลเรียบร้อยแล้ว', message: 'ข้อมูลใหม่ถูกบันทึกแล้ว' });
      await loadCustomers();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'แก้ไขไม่สำเร็จ', message: 'หน้าต่างแก้ไขยังไม่ปิด เพื่อป้องกันข้อมูลหาย' });
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
        <button className={`menu ${page === 'form' ? 'active' : ''}`} onClick={() => goToPage('form')}>＋ บันทึกข้อมูลลูกค้า</button>
        <button className={`menu ${page === 'list' ? 'active' : ''}`} onClick={() => goToPage('list')}>☰ รายการทั้งหมด</button>
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
                <span>กรอกข้อมูลให้ครบถ้วนเพื่อเก็บเป็นประวัติลูกค้า ระบบจะเก็บร่างข้อมูลอัตโนมัติ</span>
              </div>
              {formDirty && <span className="draft-pill">บันทึกร่างอัตโนมัติแล้ว</span>}
            </div>

            <CustomerFields data={form} onChange={updateField} />
            <div className="actions">
              <button className="btn primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
              <button type="button" className="btn secondary" onClick={() => (formDirty ? setConfirmClearForm(true) : setForm(emptyForm))} disabled={saving}>ล้างข้อมูล</button>
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
              <button className="btn secondary" onClick={() => goToPage('form')}>เพิ่มรายการใหม่</button>
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
                          <button className="small-btn primary-action" onClick={() => openEdit(item)}>แก้ไข</button>
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
            <div className="modal-links">{renderModalLinks(viewing)}</div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop">
          <form className="modal edit-modal" onSubmit={submitEdit} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-kicker">แก้ไขข้อมูลจากรายการทั้งหมด</span>
                <h2>{editing.plate || 'แก้ไขข้อมูลลูกค้า'}</h2>
              </div>
              <button type="button" className="close-btn" onClick={requestCloseEdit}>×</button>
            </div>
            {editDirty && <div className="draft-warning">มีข้อมูลที่แก้ไขแล้วยังไม่ได้บันทึก กรุณากด “บันทึกการแก้ไข” เพื่อไม่ให้ข้อมูลหาย</div>}
            <CustomerFields data={editForm} onChange={updateEditField} />
            <div className="actions modal-actions">
              <button type="button" className="btn secondary" onClick={requestCloseEdit} disabled={saving}>ปิด</button>
              <button className="btn primary" disabled={saving || !editDirty}>{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
            </div>
          </form>
        </div>
      )}

      {confirmLeaveForm && (
        <ConfirmDialog
          title="ยังไม่ได้บันทึกข้อมูล"
          message="ข้อมูลที่กรอกไว้ถูกเก็บเป็นร่างอัตโนมัติแล้ว แต่ถ้าต้องการไปหน้ารายการทั้งหมดโดยล้างร่าง ให้กดยืนยัน"
          cancelText="อยู่หน้านี้ต่อ"
          confirmText="ไปหน้ารายการ"
          onCancel={() => setConfirmLeaveForm(null)}
          onConfirm={() => {
            setConfirmLeaveForm(null);
            setPage('list');
            loadCustomers();
          }}
        />
      )}

      {confirmClearForm && (
        <ConfirmDialog
          title="ล้างข้อมูลในฟอร์ม?"
          message="ระบบพบข้อมูลที่ยังไม่ได้บันทึก ถ้าล้างข้อมูล ร่างที่เก็บไว้จะถูกลบด้วย"
          cancelText="ยกเลิก"
          confirmText="ล้างข้อมูล"
          onCancel={() => setConfirmClearForm(false)}
          onConfirm={() => {
            setForm(emptyForm);
            localStorage.removeItem(DRAFT_KEY);
            setConfirmClearForm(false);
            showToast({ type: 'info', title: 'ล้างข้อมูลเรียบร้อยแล้ว' });
          }}
          danger
        />
      )}

      {confirmCloseEdit && (
        <ConfirmDialog
          title="ยังไม่ได้บันทึกการแก้ไข"
          message="ถ้าปิดหน้าต่างตอนนี้ ข้อมูลที่แก้ไขไว้ในหน้าต่างนี้จะหาย"
          cancelText="กลับไปแก้ไขต่อ"
          confirmText="ปิดโดยไม่บันทึก"
          onCancel={() => setConfirmCloseEdit(false)}
          onConfirm={() => {
            setConfirmCloseEdit(false);
            setEditing(null);
            setEditForm(emptyForm);
          }}
          danger
        />
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

function CustomerFields({ data, onChange }: { data: Customer; onChange: (field: keyof Customer, value: string) => void }) {
  return (
    <div className="grid">
      <div><label>วันที่</label><input type="date" value={data.serviceDate} onChange={(e) => onChange('serviceDate', e.target.value)} required /></div>
      <div><label>ทะเบียนรถ</label><input value={data.plate} onChange={(e) => onChange('plate', e.target.value)} placeholder="เช่น กก 1234" required /></div>
      <div><label>ยี่ห้อรถ</label><input value={data.brand} onChange={(e) => onChange('brand', e.target.value)} placeholder="เช่น Toyota" /></div>
      <div><label>รุ่นรถ</label><input value={data.model} onChange={(e) => onChange('model', e.target.value)} placeholder="เช่น Fortuner 2.4 V" /></div>
      <div className="full"><label>ชื่อผู้เข้าใช้บริการ / ชื่อบริษัท / ชื่อบุคคล</label><input value={data.customerName} onChange={(e) => onChange('customerName', e.target.value)} required /></div>
      <div><label>เบอร์ติดต่อ</label><input value={data.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="081-234-5678" /></div>
      <div><label>การรับประกัน</label><input value={data.warranty} onChange={(e) => onChange('warranty', e.target.value)} placeholder="เช่น 6 เดือน หรือ 10,000 กม." /></div>
      <div className="full"><label>รายละเอียดการซ่อม</label><textarea value={data.repairDetail} onChange={(e) => onChange('repairDetail', e.target.value)} placeholder="ระบุรายละเอียดงานซ่อม" /></div>
      <div><label>ราคา</label><input type="number" value={data.price} onChange={(e) => onChange('price', e.target.value)} placeholder="12500" /></div>
      <div><label>สถานะ</label><select value={data.status} onChange={(e) => onChange('status', e.target.value)}><option>รอตรวจสอบ</option><option>กำลังดำเนินการ</option><option>เสร็จสิ้น</option></select></div>
      <div><label>ลิงก์รูปบิล</label><input value={data.billImage} onChange={(e) => onChange('billImage', e.target.value)} placeholder="https://..." /></div>
      <div><label>ลิงก์หน้ารถ</label><input value={data.carFrontImage} onChange={(e) => onChange('carFrontImage', e.target.value)} placeholder="https://..." /></div>
      <div className="full"><label>ลิงก์รูปส่วนที่ต้องซ่อม</label><input value={data.repairImage} onChange={(e) => onChange('repairImage', e.target.value)} placeholder="https://..." /></div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
  danger
}: {
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${danger ? 'danger-icon' : 'safe-icon'}`}>!</div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn secondary" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${danger ? 'danger-solid' : 'primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
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

function getEditableCustomer(item: Customer) {
  return {
    serviceDate: item.serviceDate || '',
    plate: item.plate || '',
    brand: item.brand || '',
    model: item.model || '',
    customerName: item.customerName || '',
    phone: item.phone || '',
    repairDetail: item.repairDetail || '',
    warranty: item.warranty || '',
    price: item.price || '',
    billImage: item.billImage || '',
    carFrontImage: item.carFrontImage || '',
    repairImage: item.repairImage || '',
    status: item.status || 'รอตรวจสอบ'
  };
}

function isCustomerFormEmpty(item: Customer) {
  const editable = getEditableCustomer(item);
  return Object.entries(editable).every(([key, value]) => {
    if (key === 'status') return value === emptyForm.status;
    return String(value ?? '').trim() === '';
  });
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
