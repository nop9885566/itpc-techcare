'use client'

import { useState } from 'react'
import { KeyRound, UserRound } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { updateOwnProfile } from '@/lib/queries'

export default function ProfilePage() {
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (pin && !/^\d{4,6}$/.test(pin)) {
      setError('PIN ใหม่ต้องเป็นตัวเลข 4–6 หลัก')
      return
    }
    if (pin !== confirmPin) {
      setError('PIN ใหม่และยืนยัน PIN ไม่ตรงกัน')
      return
    }

    setSaving(true)
    try {
      const updatedUser = await updateOwnProfile(name, pin || undefined)
      login(updatedUser)
      setPin('')
      setConfirmPin('')
      setMessage('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'บันทึกข้อมูลไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="page-container page-container-narrow">
      <section className="page-heading">
        <div>
          <div className="eyebrow">MY ACCOUNT</div>
          <h1>ข้อมูลส่วนตัว</h1>
          <p>ครูผู้ดูแลแก้ไขได้เฉพาะข้อมูลบัญชีของตนเอง</p>
        </div>
      </section>

      <section className="card profile-card">
        <div className="profile-identity">
          <div className="account-avatar account-avatar-large"><UserRound size={26} /></div>
          <div>
            <strong>{user.name}</strong>
            <span className={`account-role role-${user.role}`}>
              {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ครูที่ปรึกษา'}
            </span>
          </div>
        </div>
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label className="label" htmlFor="profile-name">ชื่อที่แสดง</label>
            <input
              id="profile-name"
              className="input"
              value={name}
              onChange={event => setName(event.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="profile-divider" />
          <div className="form-group">
            <label className="label" htmlFor="profile-pin">PIN ใหม่ (เว้นว่างหากไม่เปลี่ยน)</label>
            <div className="input-with-icon">
              <KeyRound size={17} />
              <input
                id="profile-pin"
                className="input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                minLength={4}
                maxLength={6}
                value={pin}
                onChange={event => setPin(event.target.value.replace(/\D/g, ''))}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="profile-pin-confirm">ยืนยัน PIN ใหม่</label>
            <input
              id="profile-pin-confirm"
              className="input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={event => setConfirmPin(event.target.value.replace(/\D/g, ''))}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="inline-error" role="alert">{error}</p>}
          {message && <p className="inline-success" role="status">{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </form>
      </section>
    </div>
  )
}
