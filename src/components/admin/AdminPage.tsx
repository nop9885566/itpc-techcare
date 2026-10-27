'use client'

import { useCallback, useEffect, useState } from 'react'
import { Archive, Check, Edit2, Plus, ShieldCheck, UserRound } from 'lucide-react'
import { getCaretakerAccounts, manageCaretaker, setCaretakerDisabled } from '@/lib/queries'
import type { Caretaker, UserRole } from '@/lib/types'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatThaiDateTime } from '@/lib/dateUtils'

interface AccountForm {
  id?: string
  name: string
  role: UserRole
  pin: string
}

const EMPTY_FORM: AccountForm = { name: '', role: 'caretaker', pin: '' }

export default function AdminPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Caretaker[]>([])
  const [form, setForm] = useState<AccountForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadAccounts = useCallback(async () => {
    try {
      const data = await getCaretakerAccounts()
      setAccounts(data)
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'โหลดบัญชีไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getCaretakerAccounts()
      .then(data => {
        if (!active) return
        setAccounts(data)
        setError('')
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'โหลดบัญชีไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function saveAccount(event: React.FormEvent) {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    try {
      await manageCaretaker({
        id: form.id,
        name: form.name,
        role: form.role,
        pin: form.pin || undefined,
      })
      setForm(null)
      await loadAccounts()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'บันทึกบัญชีไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAccount(account: Caretaker) {
    const disabled = !account.disabled_at
    const prompt = disabled
      ? `ปิดบัญชี ${account.name}? บัญชีจะเข้าสู่ระบบไม่ได้`
      : `เปิดบัญชี ${account.name} อีกครั้ง?`
    if (!confirm(prompt)) return

    setError('')
    try {
      await setCaretakerDisabled(account.id, disabled)
      await loadAccounts()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'เปลี่ยนสถานะบัญชีไม่สำเร็จ')
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <ShieldCheck size={42} />
        <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <section className="page-heading">
        <div>
          <div className="eyebrow">ADMINISTRATION</div>
          <h1>จัดการบัญชีผู้ใช้</h1>
          <p>เพิ่ม แก้ไขบทบาท และปิดบัญชีผู้ดูแลหรือครูที่ปรึกษา</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setForm({ ...EMPTY_FORM })}>
          <Plus size={17} /> เพิ่มบัญชี
        </button>
      </section>

      <section className="card account-list" aria-label="รายชื่อบัญชี">
        <div className="account-list-heading">
          <strong>{accounts.length} บัญชี</strong>
          <span>ปิดบัญชีแล้วจะไม่สามารถเข้าสู่ระบบได้</span>
        </div>

        {error && <p className="inline-error" role="alert">{error}</p>}
        {loading ? (
          <div className="empty-state" style={{ minHeight: 180 }}><div className="spinner" /></div>
        ) : accounts.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 180 }}>ยังไม่มีบัญชีผู้ใช้</div>
        ) : (
          <div className="account-rows">
            {accounts.map(account => {
              const isActive = !account.disabled_at
              return (
                <article className={`account-row${isActive ? '' : ' account-row-disabled'}`} key={account.id}>
                  <div className="account-avatar">
                    {account.role === 'admin' ? <ShieldCheck size={20} /> : <UserRound size={20} />}
                  </div>
                  <div className="account-details">
                    <strong>{account.name}</strong>
                    <div className="account-meta">
                      <span className={`account-role role-${account.role}`}>
                        {account.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ดูแล'}
                      </span>
                      <span className={isActive ? 'status-active' : 'status-disabled'}>
                        {isActive ? 'ใช้งานอยู่' : `ปิดเมื่อ ${formatThaiDateTime(account.disabled_at)}`}
                      </span>
                    </div>
                  </div>
                  <div className="account-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => setForm({ id: account.id, name: account.name, role: account.role, pin: '' })}
                    >
                      <Edit2 size={15} /> แก้ไข
                    </button>
                    {account.id !== user.id && (
                      <button
                        className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-outline'}`}
                        type="button"
                        onClick={() => toggleAccount(account)}
                      >
                        {isActive ? <Archive size={15} /> : <Check size={15} />}
                        {isActive ? 'ปิดบัญชี' : 'เปิดใช้งาน'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {form && (
        <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setForm(null) }}>
          <div className="modal-panel animate-in">
            <h2>{form.id ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีผู้ใช้'}</h2>
            <p className="modal-description">PIN ใช้เข้าสู่ระบบและจัดเก็บเป็นค่าแฮชเท่านั้น</p>
            <form onSubmit={saveAccount}>
              <div className="form-group">
                <label className="label" htmlFor="account-name">ชื่อบัญชี</label>
                <input
                  id="account-name"
                  className="input"
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                  required
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="account-role">บทบาท</label>
                <select
                  id="account-role"
                  className="input"
                  value={form.role}
                  onChange={event => setForm({ ...form, role: event.target.value as UserRole })}
                >
                  <option value="caretaker">ผู้ดูแล</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="account-pin">{form.id ? 'PIN ใหม่ (เว้นว่างเพื่อไม่เปลี่ยน)' : 'PIN'}</label>
                <input
                  id="account-pin"
                  className="input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                  minLength={4}
                  value={form.pin}
                  onChange={event => setForm({ ...form, pin: event.target.value.replace(/\D/g, '') })}
                  required={!form.id}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="inline-error" role="alert">{error}</p>}
              <div className="modal-actions">
                <button className="btn btn-ghost" type="button" onClick={() => setForm(null)}>ยกเลิก</button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึกบัญชี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
