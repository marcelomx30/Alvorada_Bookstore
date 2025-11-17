import { API_URL } from '../config'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email })
      setEmailSent(true)
      setMessage('Instruções enviadas! Verifique seu email.')
    } catch (err) {
      setError(err.response?.data || 'Erro ao enviar email. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h1>
          <p className="text-gray-600">
            Sem problemas! Digite seu email e enviaremos instruções para redefinir sua senha
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!emailSent ? (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-alvorada-blue focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-alvorada-blue to-alvorada-blue-dark text-white py-3 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Instruções'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Email Enviado!</h3>
              <p className="text-gray-600 mb-8">
                Verifique sua caixa de entrada em <span className="font-semibold">{email}</span>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Não recebeu o email?</strong><br />
                  Verifique sua pasta de spam ou tente novamente em alguns minutos
                </p>
              </div>
              <button
                onClick={() => setEmailSent(false)}
                className="text-alvorada-blue font-semibold hover:underline"
              >
                Enviar novamente
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-gray-600 hover:text-alvorada-blue transition-colors inline-flex items-center"
            >
              <span className="mr-2">←</span>
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
