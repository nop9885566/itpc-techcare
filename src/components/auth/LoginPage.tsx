'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { loginCaretaker } from '@/lib/queries'
import { useAuth } from '@/components/providers/AuthProvider'
import BrandLogo from '@/components/brand/BrandLogo'

export default function LoginPage() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('กรุณากรอกชื่อบัญชี')
      return
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN ต้องเป็นตัวเลข 4–6 หลัก')
      return
    }

    setLoading(true)
    try {
      const result = await loginCaretaker(name, pin)
      if (result.success && result.caretaker) {
        login(result.caretaker)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <BrandLogo large />
        </div>

        {/* Login Card */}
        <div className="card animate-in">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="caretaker-name">
                ชื่อบัญชี
              </label>
              <input
                id="caretaker-name"
                className="input"
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="กรอกชื่อบัญชี"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="pin-input">
                PIN (4–6 หลัก)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="pin-input"
                  className="input"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="กรอก PIN"
                  value={pin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '')
                    setPin(v)
                    setError('')
                  }}
                  style={{ paddingRight: '3rem' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    padding: 0,
                  }}
                  aria-label={showPin ? 'ซ่อน PIN' : 'แสดง PIN'}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-error-text)',
                  backgroundColor: 'var(--color-error-bg)',
                  border: '1px solid var(--color-error-border)',
                  borderRadius: 8,
                  padding: '0.625rem 0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--color-text-light)',
            marginTop: '1.25rem',
            lineHeight: 1.6,
          }}
        >
          เข้าสู่ระบบสำหรับผู้ดูแลและครูที่ปรึกษา
          <br />
          การเชื่อมต่อข้อมูลถูกตรวจสอบสิทธิ์จากฝั่งเซิร์ฟเวอร์
        </p>
      </div>
    </div>
  )
}
