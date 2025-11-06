import { useEffect } from 'react'

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }[type]

  return (
    <div className="animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
        <span className="text-2xl">{icon}</span>
        <p className="flex-1 text-sm md:text-base">{message}</p>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-xl">✕</button>
      </div>
    </div>
  )
}

export default Toast
