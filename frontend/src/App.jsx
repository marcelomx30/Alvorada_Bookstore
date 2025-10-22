import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalBooks, setTotalBooks] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const booksPerPage = 20

  useEffect(() => {
    if (isSearching && searchQuery) {
      performSearch(currentPage)
    } else {
      fetchBooks(currentPage)
    }
  }, [currentPage])

  const fetchBooks = (page) => {
    setLoading(true)
    setIsSearching(false)
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

  const performSearch = (page) => {
    if (!searchQuery.trim()) {
      fetchBooks(page)
      return
    }

    setLoading(true)
    setIsSearching(true)
    
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

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    performSearch(1)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchType('all')
    setCurrentPage(1)
    fetchBooks(1)
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
      {/* Hero Section - Solid Blue */}
      <header className="bg-alvorada-blue text-white shadow-lg">
        <div className="container mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4">📚 Biblioteca Alvorada</h1>
          <p className="text-xl text-blue-100">
            Descubra, empreste e explore nossa coleção de livros
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por título, autor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent"
                />
              </div>

              {/* Search Type */}
              <div className="w-full md:w-48">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent"
                >
                  <option value="all">Todos os campos</option>
                  <option value="title">Apenas título</option>
                  <option value="author">Apenas autor</option>
                </select>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="px-8 py-3 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors font-semibold shadow-md"
              >
                🔍 Buscar
              </button>

              {/* Clear Button */}
              {isSearching && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-8 py-3 bg-alvorada-coral text-white rounded-lg hover:bg-alvorada-coral-dark transition-colors font-semibold shadow-md"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </form>

          {/* Search Info */}
          {isSearching && (
            <div className="mt-4 text-gray-600">
              Buscando por: <span className="font-semibold text-alvorada-blue">"{searchQuery}"</span>
              {searchType !== 'all' && (
                <span> em <span className="font-semibold">{searchType === 'title' ? 'títulos' : 'autores'}</span></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isSearching ? 'Resultados da Busca' : 'Catálogo de Livros'}
          </h2>
          <p className="text-gray-600">
            {totalBooks} {totalBooks === 1 ? 'livro' : 'livros'} • Página {currentPage} de {totalPages}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Solid Coral Top Bar */}
                  <div className="bg-alvorada-coral h-2"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                      {book.nome}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Autor:</span> {book.autor}
                      </p>
                      <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Categoria:</span>{' '}
                        <span className="inline-block bg-alvorada-gold bg-opacity-30 text-alvorada-coral-dark px-3 py-1 rounded-full text-xs font-medium">
                          {book.categoria}
                        </span>
                      </p>
                      <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Cópias:</span> {book.numero_copias}
                      </p>
                    </div>

                    {/* Solid Blue Button */}
                    <button className="w-full bg-alvorada-blue text-white py-2 rounded-lg hover:bg-alvorada-blue-dark transition-all duration-300 font-semibold">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg transition-colors shadow-md ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-alvorada-gold hover:text-white'
                    }`}
                  >
                    ← Anterior
                  </button>

                  {renderPageNumbers()}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg transition-colors shadow-md ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-alvorada-gold hover:text-white'
                    }`}
                  >
                    Próxima →
                  </button>
                </div>

                <p className="text-gray-600 text-sm">
                  Mostrando {(currentPage - 1) * booksPerPage + 1} - {Math.min(currentPage * booksPerPage, totalBooks)} de {totalBooks} livros
                </p>
              </div>
            )}
          </>
        )}

        {!loading && books.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {isSearching ? `Nenhum livro encontrado para "${searchQuery}"` : 'Nenhum livro encontrado'}
            </p>
            {isSearching && (
              <button
                onClick={handleClearSearch}
                className="mt-4 px-6 py-2 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors shadow-md"
              >
                Ver todos os livros
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default App
