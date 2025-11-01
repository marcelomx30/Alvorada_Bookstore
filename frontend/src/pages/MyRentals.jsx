import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

function MyRentals() {
  const { user, logout } = useAuth()
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMyRentals()
  }, [])

  const fetchMyRentals = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8080/api/rentals/my', {
        withCredentials: true
      })
      setRentals(response.data || [])
    } catch (error) {
      console.error('Error fetching rentals:', error)
      alert('Erro ao carregar aluguéis')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnBook = async (rentalId, bookName) => {
    if (!window.confirm(`Deseja devolver "${bookName}"?`)) {
      return
    }
    try {
      await axios.put(`http://localhost:8080/api/rentals/${rentalId}/return`, {}, {
        withCredentials: true
      })
      alert('✅ Livro devolvido com sucesso!')
      fetchMyRentals()
    } catch (error) {
      const errorMsg = error.response?.data || 'Erro ao devolver livro. Tente novamente.'
      alert(`❌ ${errorMsg}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'returned':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'returned':
        return 'Devolvido'
      case 'overdue':
        return 'Atrasado'
      default:
        return status
    }
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

  const filteredRentals = rentals.filter(rental => {
    if (filter === 'all') return true
    if (filter === 'overdue') return isOverdue(rental.due_date, rental.status)
    return rental.status === filter
  })

  const activeCount = rentals.filter(r => r.status === 'active').length
  const overdueCount = rentals.filter(r => isOverdue(r.due_date, r.status)).length

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
              <a href="/my-rentals" className="text-alvorada-blue font-semibold border-b-2 border-alvorada-blue">📖 Meus Aluguéis</a>
              {user?.role === 'admin' && (
                <a href="/admin/books" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">⚙️ Admin</a>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">Olá, <span className="font-semibold">{user?.name}</span></p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={logout} className="px-4 py-2 bg-alvorada-coral text-white rounded-lg hover:bg-alvorada-coral-dark transition-colors font-semibold">Sair</button>
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-r from-alvorada-blue to-alvorada-blue-dark text-white shadow-lg">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-2">📖 Meus Aluguéis</h1>
          <p className="text-xl text-blue-100">Acompanhe seus livros alugados e prazos de devolução</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total de Aluguéis</p>
                <p className="text-3xl font-bold text-gray-900">{rentals.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📚</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Aluguéis Ativos</p>
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
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por:</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos ({rentals.length})</button>
            <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'active' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ativos ({activeCount})</button>
            <button onClick={() => setFilter('returned')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'returned' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Devolvidos ({rentals.filter(r => r.status === 'returned').length})</button>
            <button onClick={() => setFilter('overdue')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'overdue' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Atrasados ({overdueCount})</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div></div>
        ) : filteredRentals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{filter === 'all' ? 'Nenhum aluguel encontrado' : 'Nenhum aluguel nesta categoria'}</h3>
            <p className="text-gray-600 mb-6">{filter === 'all' ? 'Você ainda não alugou nenhum livro. Explore nosso catálogo!' : 'Tente outro filtro para ver seus aluguéis'}</p>
            {filter === 'all' && (<a href="/" className="inline-block px-6 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors font-semibold">Ir para o Catálogo</a>)}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental) => {
              const overdue = isOverdue(rental.due_date, rental.status)
              return (
                <div key={rental.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${overdue ? 'border-l-4 border-red-500' : ''}`}>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{rental.book_name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(overdue && rental.status === 'active' ? 'overdue' : rental.status)}`}>{overdue && rental.status === 'active' ? '⚠️ Atrasado' : getStatusText(rental.status)}</span>
                        </div>
                        <p className="text-gray-600 mb-3"><span className="font-semibold">Autor:</span> {rental.book_author}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Alugado em</p>
                            <p className="font-semibold text-gray-900">{formatDate(rental.rented_at)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Devolução</p>
                            <p className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(rental.due_date)}</p>
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
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600"><span className="font-semibold">Observações:</span> {rental.notes}</p>
                          </div>
                        )}
                      </div>
                      {rental.status === 'active' && (
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <button onClick={() => handleReturnBook(rental.id, rental.book_name)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap">Devolver Livro</button>
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

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default MyRentals
