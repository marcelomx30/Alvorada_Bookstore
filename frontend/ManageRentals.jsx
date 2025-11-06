import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../../components/ConfirmModal'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ManageRentals() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [rentals, setRentals] = useState([])
  const [filteredRentals, setFilteredRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showRentModal, setShowRentModal] = useState(false)
  const [users, setUsers] = useState([])
  const [books, setBooks] = useState([])
  const [loadingModal, setLoadingModal] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showBookDropdown, setShowBookDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [rentFormData, setRentFormData] = useState({
    user_id: '',
    book_id: '',
    notes: ''
  })
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
    fetchRentals()
  }, [user, navigate])

  useEffect(() => {
    applyFilters()
  }, [filter, searchQuery, rentals])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setShowUserDropdown(false)
        setShowBookDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchRentals = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8080/api/admin/rentals', {
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

  const fetchUsersAndBooks = async () => {
    setLoadingModal(true)
    try {
      const booksResponse = await axios.get('http://localhost:8080/api/books?limit=1000')
      setBooks(booksResponse.data.books || [])
      
      const uniqueUsers = []
      const userMap = new Map()
      rentals.forEach(rental => {
        if (!userMap.has(rental.user_id)) {
          userMap.set(rental.user_id, {
            id: rental.user_id,
            name: rental.user_name,
            email: rental.user_email
          })
          uniqueUsers.push({
            id: rental.user_id,
            name: rental.user_name,
            email: rental.user_email
          })
        }
      })
      setUsers(uniqueUsers)
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Erro ao carregar dados para aluguel', 'error')
    } finally {
      setLoadingModal(false)
    }
  }

  const openRentModal = () => {
    setShowRentModal(true)
    setSelectedUser(null)
    setSelectedBook(null)
    setUserSearchQuery('')
    setBookSearchQuery('')
    setShowUserDropdown(false)
    setShowBookDropdown(false)
    fetchUsersAndBooks()
  }

  const applyFilters = () => {
    let filtered = [...rentals]
    if (filter !== 'all') {
      if (filter === 'overdue') {
        filtered = filtered.filter(r => isOverdue(r.due_date, r.status))
      } else {
        filtered = filtered.filter(r => r.status === filter)
      }
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.book_name.toLowerCase().includes(query) ||
        r.user_name.toLowerCase().includes(query) ||
        r.user_email.toLowerCase().includes(query)
      )
    }
    setFilteredRentals(filtered)
  }

  const handleRentForUser = async (e) => {
    e.preventDefault()
    if (!rentFormData.user_id || !rentFormData.book_id) {
      showToast('Por favor, selecione um usuário e um livro', 'error')
      return
    }
    try {
      await axios.post('http://localhost:8080/api/admin/rentals', {
        user_id: parseInt(rentFormData.user_id),
        book_id: parseInt(rentFormData.book_id),
        notes: rentFormData.notes
      }, {
        withCredentials: true
      })
      showToast('Livro alugado com sucesso!', 'success')
      setShowRentModal(false)
      setSelectedUser(null)
      setSelectedBook(null)
      setUserSearchQuery('')
      setBookSearchQuery('')
      setRentFormData({ user_id: '', book_id: '', notes: '' })
      fetchRentals()
    } catch (error) {
      showToast(error.response?.data || 'Erro ao alugar livro', 'error')
    }
  }

  const handleReturnBook = async (rentalId, bookName, userName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Marcar como Devolvido',
      message: `Marcar "${bookName}" (alugado por ${userName}) como devolvido?`,
      onConfirm: async () => {
        try {
          await axios.put(`http://localhost:8080/api/admin/rentals/${rentalId}/return`, {}, {
            withCredentials: true
          })
          showToast('Livro marcado como devolvido!', 'success')
          fetchRentals()
        } catch (error) {
          showToast(error.response?.data || 'Erro ao devolver livro', 'error')
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })
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
                    <a href="/admin/books" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">📚 Gerenciar Livros</a>
                    <a href="/admin/rentals" className="block px-4 py-2 text-alvorada-blue font-semibold bg-blue-50">📋 Gerenciar Aluguéis</a>
                    <a href="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">👥 Gerenciar Usuários</a>
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
          <h1 className="text-4xl font-bold mb-2">📋 Gerenciar Aluguéis</h1>
          <p className="text-xl text-blue-100">Visualizar e gerenciar todos os aluguéis de livros</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <button onClick={openRentModal} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md">
            ➕ Alugar Livro para Usuário
          </button>
          <div className="flex-1">
            <input type="text" placeholder="Buscar por livro, usuário ou email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por:</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos ({rentals.length})</button>
            <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'active' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ativos ({activeCount})</button>
            <button onClick={() => setFilter('overdue')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'overdue' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Atrasados ({overdueCount})</button>
            <button onClick={() => setFilter('returned')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'returned' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Devolvidos ({returnedCount})</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <p className="text-gray-600">Mostrando <span className="font-semibold">{filteredRentals.length}</span> de <span className="font-semibold">{rentals.length}</span> aluguéis{searchQuery && ` • Filtrados por: "${searchQuery}"`}</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div></div>
        ) : filteredRentals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum aluguel encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou a busca</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental) => {
              const overdue = isOverdue(rental.due_date, rental.status)
              return (
                <div key={rental.id} className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${overdue ? 'border-l-4 border-red-500' : ''}`}>
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{rental.book_name}</h3>
                            <p className="text-gray-600"><span className="font-semibold">Autor:</span> {rental.book_author}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rental.status, rental.due_date)}`}>{getStatusText(rental.status, rental.due_date)}</span>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-semibold text-gray-900">👤 {rental.user_name}</p>
                          <p className="text-sm text-gray-600">📧 {rental.user_email}</p>
                        </div>
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
                        <div className="lg:ml-6">
                          <button onClick={() => handleReturnBook(rental.id, rental.book_name, rental.user_name)} className="w-full lg:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap">✅ Marcar como Devolvido</button>
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

      {showRentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">➕ Alugar Livro para Usuário</h2>
            {loadingModal ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alvorada-blue"></div></div>
            ) : (
              <form onSubmit={handleRentForUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
                  <div className="relative dropdown-container">
                    <input type="text" required value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearchQuery} onChange={(e) => {setUserSearchQuery(e.target.value); setSelectedUser(null); setShowUserDropdown(true)}} onFocus={() => setShowUserDropdown(true)} placeholder="Digite o nome ou email do usuário..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
                    {showUserDropdown && !selectedUser && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase())).map(u => (
                          <div key={u.id} onClick={() => {setSelectedUser(u); setRentFormData({...rentFormData, user_id: u.id}); setShowUserDropdown(false); setUserSearchQuery('')}} className="px-4 py-2 hover:bg-alvorada-blue hover:text-white cursor-pointer transition-colors">
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs opacity-75">{u.email}</p>
                          </div>
                        ))}
                        {users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase())).length === 0 && (<div className="px-4 py-3 text-gray-500 text-center">Nenhum usuário encontrado</div>)}
                      </div>
                    )}
                    {selectedUser && (<button type="button" onClick={() => {setSelectedUser(null); setRentFormData({...rentFormData, user_id: ''}); setUserSearchQuery('')}} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">✕</button>)}
                  </div>
                  {users.length === 0 && (<p className="text-xs text-gray-500 mt-1">Nenhum usuário encontrado. Eles aparecerão após fazerem um aluguel.</p>)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Livro *</label>
                  <div className="relative dropdown-container">
                    <input type="text" required value={selectedBook ? `${selectedBook.nome} - ${selectedBook.autor}` : bookSearchQuery} onChange={(e) => {setBookSearchQuery(e.target.value); setSelectedBook(null); setShowBookDropdown(true)}} onFocus={() => setShowBookDropdown(true)} placeholder="Digite o título ou autor do livro..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
                    {showBookDropdown && !selectedBook && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {books.filter(b => b.available_copies > 0).filter(b => b.nome.toLowerCase().includes(bookSearchQuery.toLowerCase()) || b.autor.toLowerCase().includes(bookSearchQuery.toLowerCase())).map(book => (
                          <div key={book.id} onClick={() => {setSelectedBook(book); setRentFormData({...rentFormData, book_id: book.id}); setShowBookDropdown(false); setBookSearchQuery('')}} className="px-4 py-2 hover:bg-alvorada-blue hover:text-white cursor-pointer transition-colors border-b border-gray-100 last:border-0">
                            <p className="font-semibold">{book.nome}</p>
                            <p className="text-xs opacity-75">{book.autor}</p>
                            <p className="text-xs opacity-75 mt-1"><span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded">{book.available_copies} disponíveis</span></p>
                          </div>
                        ))}
                        {books.filter(b => b.available_copies > 0).filter(b => b.nome.toLowerCase().includes(bookSearchQuery.toLowerCase()) || b.autor.toLowerCase().includes(bookSearchQuery.toLowerCase())).length === 0 && (<div className="px-4 py-3 text-gray-500 text-center">Nenhum livro disponível encontrado</div>)}
                      </div>
                    )}
                    {selectedBook && (<button type="button" onClick={() => {setSelectedBook(null); setRentFormData({...rentFormData, book_id: ''}); setBookSearchQuery('')}} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">✕</button>)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea value={rentFormData.notes} onChange={(e) => setRentFormData({...rentFormData, notes: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" rows="3" placeholder="Observações adicionais (opcional)" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">Alugar</button>
                  <button type="button" onClick={() => {setShowRentModal(false); setSelectedUser(null); setSelectedBook(null); setUserSearchQuery(''); setBookSearchQuery(''); setRentFormData({ user_id: '', book_id: '', notes: '' })}} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        confirmText="Confirmar"
        type="success"
      />

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default ManageRentals
