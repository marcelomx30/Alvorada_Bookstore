import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

function BookCatalog() {
  const { user, logout } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalBooks, setTotalBooks] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [rentingBookId, setRentingBookId] = useState(null)
  const booksPerPage = 20

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchBooksByCategory(currentPage)
    } else if (isSearching && searchQuery) {
      performSearch(currentPage)
    } else {
      fetchBooks(currentPage)
    }
  }, [currentPage, selectedCategory])

  const fetchCategories = () => {
    axios.get('http://localhost:8080/api/categories')
      .then(response => {
        setCategories(response.data || [])
      })
      .catch(error => {
        console.error('Error fetching categories:', error)
      })
  }

  const fetchBooks = (page) => {
    setLoading(true)
    setIsSearching(false)
    setSelectedCategory(null)
    axios.get(`http://localhost:8080/api/books?page=${page}&limit=${booksPerPage}`)
      .then(response => {
        setBooks(response.data.books || [])
        setCurrentPage(response.data.currentPage)
        setTotalPages(response.data.totalPages)
        setTotalBooks(response.data.totalBooks)
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch(error => {
        console.error('Error fetching books:', error)
        setLoading(false)
      })
  }

  const fetchBooksByCategory = (page) => {
    if (!selectedCategory) return
    
    setLoading(true)
    setIsSearching(false)
    
    axios.get(`http://localhost:8080/api/books/category/${encodeURIComponent(selectedCategory)}?page=${page}&limit=${booksPerPage}`)
      .then(response => {
        setBooks(response.data.books || [])
        setCurrentPage(response.data.currentPage)
        setTotalPages(response.data.totalPages)
        setTotalBooks(response.data.totalBooks)
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch(error => {
        console.error('Error fetching books by category:', error)
        setLoading(false)
      })
  }

  const performSearch = (page) => {
    if (!searchQuery.trim()) {
      fetchBooks(page)
      return
    }

    setLoading(true)
    setIsSearching(true)
    setSelectedCategory(null)
    
    const typeParam = searchType === 'all' ? '' : `&type=${searchType}`
    axios.get(`http://localhost:8080/api/books/search?q=${searchQuery}&page=${page}&limit=${booksPerPage}${typeParam}`)
      .then(response => {
        setBooks(response.data.books || [])
        setCurrentPage(response.data.currentPage)
        setTotalPages(response.data.totalPages)
        setTotalBooks(response.data.totalBooks)
        setLoading(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch(error => {
        console.error('Error searching books:', error)
        setLoading(false)
      })
  }

  const handleRentBook = async (bookId, bookName) => {
    if (rentingBookId) return
    
    if (!window.confirm(`Deseja alugar "${bookName}"?`)) {
      return
    }
    
    setRentingBookId(bookId)
    
    try {
      const response = await axios.post('http://localhost:8080/api/rentals', 
        { book_id: bookId, notes: '' },
        { withCredentials: true }
      )
      
      alert(`✅ Livro alugado com sucesso!\n\nDevolução até: ${response.data.rental.due_date}`)
      
      if (selectedCategory) {
        fetchBooksByCategory(currentPage)
      } else if (isSearching && searchQuery) {
        performSearch(currentPage)
      } else {
        fetchBooks(currentPage)
      }
      
    } catch (error) {
      const errorMsg = error.response?.data || 'Erro ao alugar livro. Tente novamente.'
      alert(`❌ ${errorMsg}`)
    } finally {
      setRentingBookId(null)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    performSearch(1)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchType('all')
    setSelectedCategory(null)
    setCurrentPage(1)
    fetchBooks(1)
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setSearchQuery('')
    setIsSearching(false)
    setCurrentPage(1)
  }

  const handleClearCategory = () => {
    setSelectedCategory(null)
    setCurrentPage(1)
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)
    
    if (currentPage <= 3) {
      endPage = Math.min(maxVisible, totalPages)
    }
    
    if (currentPage > totalPages - 3) {
      startPage = Math.max(1, totalPages - maxVisible + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-4 py-2 mx-1 rounded-lg transition-colors shadow-md ${
            i === currentPage
              ? 'bg-alvorada-blue text-white'
              : 'bg-white text-gray-700 hover:bg-alvorada-gold hover:text-white'
          }`}
        >
          {i}
        </button>
      )
    }
    
    return pages
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
              <a href="/" className="text-alvorada-blue font-semibold border-b-2 border-alvorada-blue">📚 Catálogo</a>
              <a href="/my-rentals" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📖 Meus Aluguéis</a>
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

      <header className="bg-alvorada-blue text-white shadow-lg">
        <div className="container mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4">📚 Catálogo de Livros</h1>
          <p className="text-xl text-blue-100">Descubra, alugue e explore nossa coleção de livros</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input type="text" placeholder="Buscar por título, autor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div className="w-full md:w-48">
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent">
                  <option value="all">Todos os campos</option>
                  <option value="title">Apenas título</option>
                  <option value="author">Apenas autor</option>
                </select>
              </div>
              <button type="submit" className="px-8 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors font-semibold shadow-md">🔍 Buscar</button>
              {isSearching && (<button type="button" onClick={handleClearSearch} className="px-8 py-3 bg-alvorada-coral text-white rounded-lg hover:bg-alvorada-coral-dark transition-colors font-semibold shadow-md">✕ Limpar</button>)}
            </div>
          </form>
          {isSearching && (<div className="mt-4 text-gray-600">Buscando por: <span className="font-semibold text-alvorada-blue">"{searchQuery}"</span>{searchType !== 'all' && (<span> em <span className="font-semibold">{searchType === 'title' ? 'títulos' : 'autores'}</span></span>)}</div>)}
        </div>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📂 Filtrar por Categoria{selectedCategory && (<button onClick={handleClearCategory} className="ml-4 text-sm bg-alvorada-coral text-white px-4 py-1 rounded-full hover:bg-alvorada-coral-dark transition-colors">✕ Limpar filtro</button>)}</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (<button key={cat.Categoria} onClick={() => handleCategorySelect(cat.Categoria)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.Categoria ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-alvorada-gold hover:text-white'}`}>{cat.Categoria} ({cat.count})</button>))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedCategory ? `📂 Categoria: ${selectedCategory}` : isSearching ? '🔍 Resultados da Busca' : '📚 Catálogo de Livros'}</h2>
          <p className="text-gray-600">{totalBooks} {totalBooks === 1 ? 'livro' : 'livros'} • Página {currentPage} de {totalPages}</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="bg-alvorada-coral h-2"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{book.nome}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600 text-sm"><span className="font-semibold">Autor:</span> {book.autor}</p>
                      <p className="text-gray-600 text-sm"><span className="font-semibold">Categoria:</span> <span className="inline-block bg-alvorada-gold bg-opacity-30 text-alvorada-coral-dark px-3 py-1 rounded-full text-xs font-medium">{book.categoria}</span></p>
                      <p className="text-gray-600 text-sm"><span className="font-semibold">Cópias disponíveis:</span> {book.available_copies}</p>
                    </div>
                    <button onClick={() => handleRentBook(book.id, book.nome)} disabled={rentingBookId === book.id || book.available_copies === 0} className={`w-full py-2 rounded-lg transition-all duration-300 font-semibold ${rentingBookId === book.id ? 'bg-gray-400 cursor-not-allowed' : book.available_copies === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-alvorada-blue text-white hover:bg-alvorada-blue-dark'}`}>{rentingBookId === book.id ? 'Alugando...' : book.available_copies === 0 ? 'Indisponível' : 'Alugar Livro'}</button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={`px-4 py-2 rounded-lg transition-colors shadow-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-alvorada-gold hover:text-white'}`}>← Anterior</button>
                  {renderPageNumbers()}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={`px-4 py-2 rounded-lg transition-colors shadow-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-alvorada-gold hover:text-white'}`}>Próxima →</button>
                </div>
                <p className="text-gray-600 text-sm">Mostrando {(currentPage - 1) * booksPerPage + 1} - {Math.min(currentPage * booksPerPage, totalBooks)} de {totalBooks} livros</p>
              </div>
            )}
          </>
        )}

        {!loading && books.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">{selectedCategory ? `Nenhum livro encontrado na categoria "${selectedCategory}"` : isSearching ? `Nenhum livro encontrado para "${searchQuery}"` : 'Nenhum livro encontrado'}</p>
            {(isSearching || selectedCategory) && (<button onClick={handleClearSearch} className="mt-4 px-6 py-2 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors shadow-md">Ver todos os livros</button>)}
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

export default BookCatalog
