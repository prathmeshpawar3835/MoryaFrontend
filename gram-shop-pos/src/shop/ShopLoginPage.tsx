import { FormEvent, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { toastApiError } from '../utils/errors'
import { useShopAuth } from './ShopAuthContext'

export function ShopLoginPage() {
  const { customer, loading, login, register } = useShopAuth()
  const [params] = useSearchParams()
  const from = params.get('from') || '/shop/account'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && customer) return <Navigate to={from.startsWith('/shop') ? from : '/shop/account'} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') await login(mobile, password)
      else await register(name, mobile, password, address)
      toast.success(mode === 'login' ? 'Welcome back' : 'Account created')
    } catch (err) {
      toastApiError(err, mode === 'login' ? 'Could not sign in' : 'Could not create account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="shop-auth" onSubmit={onSubmit}>
      <p className="shop-kicker">{mode === 'login' ? 'Account' : 'Join'}</p>
      <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
      {mode === 'register' ? (
        <>
          <label htmlFor="name">Full name</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="addr">Address</label>
          <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} />
        </>
      ) : null}
      <label htmlFor="mobile">Mobile</label>
      <input id="mobile" required value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      {mode === 'register' ? (
        <p className="small text-muted mt-2">Use 8+ characters with upper, lower, number and a symbol — the same rule as store accounts.</p>
      ) : null}
      <button type="submit" className="shop-btn shop-btn-primary w-100 mt-3" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
      <button type="button" className="btn btn-link mt-2 px-0" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
      <div className="mt-3 small">
        <Link to="/login">Staff POS login</Link>
      </div>
    </form>
  )
}
