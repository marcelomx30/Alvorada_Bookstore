import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function ManageUsers() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
  }, [user, navigate])

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📚</span>
              <span className="text-xl font-bold text-gray-800">Biblioteca Alvorada</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📚 Catálogo</a>
              <a href="/my-rentals" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📖 Meus Aluguéis</a>
              <div className="relative group">
                <button className="text-alvorada-blue font-semibold flex items-center gap-1">
                  ⚙️ Admin
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <a href="/admin/books" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">
                      📚 Gerenciar Livros
                    </a>
                    <a href="/admin/rentals" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">
                      📋 Gerenciar Aluguéis
                    </a>
                    <a href="/admin/users" className="block px-4 py-2 text-alvorada-blue font-semibold bg-blue-50">
                      👥 Gerenciar Usuários
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">Admin: <span className="font-semibold">{user?.name}</span></p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={logout} className="px-4 py-2 bg-alvorada-coral text-white rounded-lg hover:bg-alvorada-coral-dark transition-colors font-semibold">Sair</button>
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-r from-alvorada-blue to-alvorada-blue-dark text-white shadow-lg">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-2">👥 Gerenciar Usuários</h1>
          <p className="text-xl text-blue-100">Em desenvolvimento - Em breve!</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Página em Desenvolvimento</h3>
          <p className="text-gray-600 mb-6">Esta funcionalidade estará disponível em breve!</p>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default ManageUsers
