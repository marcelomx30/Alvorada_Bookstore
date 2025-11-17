import { API_URL } from '../config'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import axios from 'axios'

function BookCatalog() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    bookId: null,
    bookName: '',
    onConfirm: () => {} 
  })

  useEffect(() => {
    fetchBooks()
    fetchCategories()
  }, [currentPage, searchQuery, searchField, selectedCategory])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        limit: 12
      }

      if (searchQuery.trim()) {
        params.search = searchQuery
        if (searchField !== 'all') {
          params.field = searchField
        }
      }

      if (selectedCategory) {
        params.category = selectedCategory
      }

      const response = await axios.get(`${API_URL}/api/books`, {
        params,
        withCredentials: true
      })

      setBooks(response.data.books || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (error) {
      console.error('Error fetching books:', error)
      showToast('Erro ao carregar livros', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/books/categories`, {
        withCredentials: true
      })
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleRentBook = (bookId, bookName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Aluguel',
      message: `Deseja alugar "${bookName}"?`,
      bookId,
      bookName,
      onConfirm: async () => {
        try {
          const response = await axios.post(`${API_URL}/api/rentals`, 
            { book_id: bookId },
            { withCredentials: true }
          )
          const dueDate = new Date(response.data.rental.due_date).toLocaleDateString('pt-BR')
          showToast(`Livro alugado com sucesso! Devolução até: ${dueDate}`, 'success')
          fetchBooks()
        } catch (error) {
          const errorMsg = error.response?.data || 'Erro ao alugar livro. Tente novamente.'
          showToast(errorMsg, 'error')
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', bookId: null, bookName: '', onConfirm: () => {} })
        }
      }
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBooks()
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category)
    setCurrentPage(1)
  }

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
              <a href="/" className="text-alvorada-blue font-semibold">📚 Catálogo</a>
              <a href="/my-rentals" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📖 Meus Aluguéis</a>
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
                <a href="/" className="block text-alvorada-blue font-semibold py-2">📚 Catálogo</a>
                <a href="/my-rentals" className="block text-gray-700 hover:text-alvorada-blue font-medium py-2">📖 Meus Aluguéis</a>
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
            <span className="text-4xl sm:text-5xl mr-4">📚</span>
            <h1 className="text-3xl sm:text-4xl font-bold">Catálogo de Livros</h1>
          </div>
          <p className="text-lg sm:text-xl text-blue-100">Descubra, alugue e explore nossa coleção de livros</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Buscar por título, autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent"
              />
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent"
              >
                <option value="all">Todos os campos</option>
                <option value="nome">Título</option>
                <option value="autor">Autor</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors font-semibold shadow-md"
            >
              🔍 Buscar
            </button>
          </form>
        </div>

        {categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📑 Filtrar por Categoria</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.categoria}
                  onClick={() => handleCategoryClick(cat.categoria)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                    selectedCategory === cat.categoria
                      ? 'bg-alvorada-gold text-gray-900 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.categoria} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum livro encontrado</h3>
            <p className="text-gray-600">Tente ajustar sua busca ou filtros</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">{book.nome}</h3>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        book.available_copies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {book.available_copies > 0 ? `${book.available_copies} disp.` : 'Indisponível'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2"><span className="font-semibold">Autor:</span> {book.autor}</p>
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-alvorada-gold text-gray-800 rounded-full text-xs font-medium">
                        {book.categoria}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRentBook(book.id, book.nome)}
                      disabled={book.available_copies === 0}
                      className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                        book.available_copies > 0
                          ? 'bg-alvorada-blue text-white hover:bg-alvorada-blue-dark'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {book.available_copies > 0 ? '📖 Alugar Livro' : '❌ Indisponível'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-6 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                ← Anterior
              </button>
              <span className="text-gray-700 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-6 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </main>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', bookId: null, bookName: '', onConfirm: () => {} })}
        confirmText="Alugar"
        type="info"
      />

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm sm:text-base">© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default BookCatalog
