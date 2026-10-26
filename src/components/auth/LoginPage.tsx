'use client'

import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { getCaretakers, loginCaretaker } from '@/lib/queries'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Caretaker } from '@/lib/types'

export default function LoginPage() {
  const { login } = useAuth()
  const [caretakers, setCaretakers] = useState<Caretaker[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCaretakers, setLoadingCaretakers] = useState(true)

  useEffect(() => {
    getCaretakers()
      .then(data => {
        setCaretakers(data)
        setLoadingCaretakers(false)
      })
      .catch(() => setLoadingCaretakers(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedName) {
      setError('กรุณาเลือกชื่อผู้ดูแล')
      return
    }
    if (pin.length < 4) {
      setError('PIN ต้องมีอย่างน้อย 4 ตัว')
      return
    }

    setLoading(true)
    try {
      const result = await loginCaretaker(selectedName, pin)
      if (result.success && result.caretaker) {
        login(result.caretaker)
      } else {
        setError(result.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่')
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
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Shield size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.375rem', marginBottom: '0.25rem' }}>ITPC Techcare</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            ระบบดูแลนักเรียนรายเคส
          </p>
        </div>

        {/* Login Card */}
        <div className="card animate-in">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="caretaker-select">
                ชื่อผู้ดูแล
              </label>
              {loadingCaretakers ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem' }}>
                  <div className="spinner" />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>กำลังโหลด...</span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    id="caretaker-select"
                    className="input"
                    value={selectedName}
                    onChange={e => {
                      const opt = caretakers.find(c => c.name === e.target.value)
                      setSelectedName(e.target.value)
                      setSelectedId(opt?.id ?? '')
                      setError('')
                    }}
                  >
                    <option value="">-- เลือกชื่อ --</option>
                    {caretakers.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
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
          ระบบนี้ใช้ anon key ของ Supabase
          <br />
          ไม่เหมาะกับข้อมูลที่ต้องการความปลอดภัยสูง
        </p>
      </div>
    </div>
  )
}
