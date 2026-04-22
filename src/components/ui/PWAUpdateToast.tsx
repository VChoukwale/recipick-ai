import { useEffect, useState } from 'react'

export default function PWAUpdateToast() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setShow(true)
    })
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
      style={{
        background: 'var(--s2)',
        border: '1px solid var(--bdr-m)',
        maxWidth: 'calc(100vw - 32px)',
        minWidth: 260,
      }}
    >
      <span className="text-lg flex-shrink-0">✨</span>
      <p className="text-sm font-body flex-1" style={{ color: 'var(--t1)' }}>
        App updated! Refresh to get the latest.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-sm font-display font-700 px-3 py-1.5 rounded-xl text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #E8713A, #D85F22)' }}
      >
        Refresh
      </button>
    </div>
  )
}
