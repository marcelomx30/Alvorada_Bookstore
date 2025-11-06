import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import axios from 'axios'

function MyRentals() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [rentals, setRentals] = useState([])
  const [filteredRentals, setFilteredRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    rentalId: null,
    bookName: '',
    onConfirm: () => {} 
  })

  useEffect(() => {
    fetchRentals()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filter, rentals])

  const fetchRentals = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8080/api/rentals', {
        withCredentials: true
      })
      setRentals(response.data || [])
    } catch (error) {
      console.error('Error fetching rentals:', error)
      showToast('Erro ao carregar aluguéis', 'error')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (filter === 'all') {
      setFilteredRentals(rentals)
    } else if (filter === 'overdue') {
      setFilteredRentals(rentals.filter(r => isOverdue(r.due_date, r.status)))
    } else {
      setFilteredRentals(rentals.filter(r => r.status === filter))
    }
  }

  const handleReturnBook = (rentalId, bookName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Devolução',
      message: `Deseja devolver "${bookName}"?`,
      rentalId,
      bookName,
      onConfirm: async () => {
        try {
          await axios.put(`http://localhost:8080/api/rentals/${rentalId}/return`, {}, {
            withCredentials: true
          })
          showToast('Livro devolvido com sucesso!', 'success')
          fetchRentals()
        } catch (error) {
          const errorMsg = error.response?.data || 'Erro ao devolver livro. Tente novamente.'
          showToast(errorMsg, 'error')
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', rentalId: null, bookName: '', onConfirm: () => {} })
        }
      }
    })
  }

  const isOverdue = (dueDate, status) => {
    if (status === 'returned') return false
    const today = new Date()
    const due = new Date(dueDate)
    return today > due
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status, dueDate) => {
    if (status === 'returned') return 'bg-green-100 text-green-800'
    if (isOverdue(dueDate, status)) return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (status, dueDate) => {
    if (status === 'returned') return 'Devolvido'
    if (isOverdue(dueDate, status)) return '⚠️ Atrasado'
    return 'Ativo'
  }

  const activeCount = rentals.filter(r => r.status === 'active').length
  const overdueCount = rentals.filter(r => isOverdue(r.due_date, r.status)).length
  const returnedCount = rentals.filter(r => r.status === 'returned').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📚</span>
              <span className="text-lg sm:text-xl font-bold text-gray-800">Biblioteca Alvorada</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📚 Catálogo</a>
              <a href="/my-rentals" className="text-alvorada-blue font-semibold">📖 Meus Aluguéis</a>
              {user?.role === 'admin' && (
                <div className="relative group">
                  <button className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium flex items-center gap-1">
                    ⚙️ Admin
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <a href="/admin/books" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">📚 Gerenciar Livros</a>
                      <a href="/admin/rentals" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">📋 Gerenciar Aluguéis</a>
                      <a href="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">👥 Gerenciar Usuários</a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-gray-700 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Desktop User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Olá, <span className="font-semibold">{user?.name}</span></p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={logout} className="px-4 py-2 bg-alvorada-coral text-white rounded-lg hover:bg-alvorada-coral-dark transition-colors font-semibold">
                Sair
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="space-y-3">
                <a href="/" className="block text-gray-700 hover:text-alvorada-blue font-medium py-2">📚 Catálogo</a>
                <a href="/my-rentals" className="block text-alvorada-blue font-semibold py-2">📖 Meus Aluguéis</a>
                {user?.role === 'admin' && (
                  <>
                    <a href="/admin/books" className="block text-gray-700 hover:text-alvorada-blue font-medium py-2">📚 Gerenciar Livros</a>
                    <a href="/admin/rentals" className="block text-gray-700 hover:text-alvorada-blue font-medium py-2">📋 Gerenciar Aluguéis</a>
                    <a href="/admin/users" className="block text-gray-700 hover:text-alvorada-blue font-medium py-2">👥 Gerenciar Usuários</a>
                  </>
                )}
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 mb-2">Olá, <span className="font-semibold">{user?.name}</span></p>
                  <button onClick={logout} className="w-full px-4 py-2 bg-alvorada-coral text-white rounded-lg hover:bg-alvorada-coral-dark transition-colors font-semibold">
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <header className="bg-gradient-to-r from-alvorada-blue to-alvorada-blue-dark text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center mb-4">
            <span className="text-4xl sm:text-5xl mr-4">📖</span>
            <h1 className="text-3xl sm:text-4xl font-bold">Meus Aluguéis</h1>
          </div>
          <p className="text-lg sm:text-xl text-blue-100">Acompanhe seus livros alugados e devoluções</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900">{rentals.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📚</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ativos</p>
                <p className="text-3xl font-bold text-alvorada-blue">{activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📖</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Atrasados</p>
                <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">⚠️</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Devolvidos</p>
                <p className="text-3xl font-bold text-green-600">{returnedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por:</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={() => setFilter('all')} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${filter === 'all' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Todos ({rentals.length})
            </button>
            <button onClick={() => setFilter('active')} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${filter === 'active' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Ativos ({activeCount})
            </button>
            <button onClick={() => setFilter('overdue')} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${filter === 'overdue' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Atrasados ({overdueCount})
            </button>
            <button onClick={() => setFilter('returned')} className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${filter === 'returned' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Devolvidos ({returnedCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum aluguel encontrado</h3>
            <p className="text-gray-600 mb-6">Você ainda não alugou nenhum livro</p>
            <a href="/" className="inline-block px-6 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors font-semibold">
              📚 Ver Catálogo
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental) => {
              const overdue = isOverdue(rental.due_date, rental.status)
              return (
                <div key={rental.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${overdue ? 'border-l-4 border-red-500' : ''}`}>
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{rental.book_name}</h3>
                            <p className="text-sm sm:text-base text-gray-600">
                              <span className="font-semibold">Autor:</span> {rental.book_author}
                            </p>
                          </div>
                          <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(rental.status, rental.due_date)}`}>
                            {getStatusText(rental.status, rental.due_date)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Alugado em</p>
                            <p className="font-semibold text-gray-900">{formatDate(rental.rented_at)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Devolução</p>
                            <p className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDate(rental.due_date)}
                            </p>
                          </div>
                          {rental.returned_at && (
                            <div>
                              <p className="text-gray-500">Devolvido em</p>
                              <p className="font-semibold text-green-600">{formatDate(rental.returned_at)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Categoria</p>
                            <p className="font-semibold text-gray-900">{rental.book_category}</p>
                          </div>
                        </div>

                        {rental.notes && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Observações:</span> {rental.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {rental.status === 'active' && (
                        <div className="sm:ml-6">
                          <button
                            onClick={() => handleReturnBook(rental.id, rental.book_name)}
                            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
                          >
                            ✅ Devolver Livro
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', rentalId: null, bookName: '', onConfirm: () => {} })}
        confirmText="Devolver"
        type="success"
      />

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm sm:text-base">© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default MyRentals
