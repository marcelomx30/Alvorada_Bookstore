import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalBooks, setTotalBooks] = useState(0)
  const booksPerPage = 20

  useEffect(() => {
    fetchBooks(currentPage)
  }, [currentPage])

  const fetchBooks = (page) => {
    setLoading(true)
    axios.get(`http://localhost:8080/api/books?page=${page}&limit=${booksPerPage}`)
      .then(response => {
        setBooks(response.data.books || [])
        setCurrentPage(response.data.currentPage)
        setTotalPages(response.data.totalPages)
        setTotalBooks(response.data.totalBooks)
        setLoading(false)
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch(error => {
        console.error('Error fetching books:', error)
        setLoading(false)
      })
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
          className={`px-4 py-2 mx-1 rounded-lg transition-colors ${
            i === currentPage
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-indigo-100'
          }`}
        >
          {i}
        </button>
      )
    }
    
    return pages
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold mb-4">📚 Biblioteca Alvorada</h1>
          <p className="text-xl text-indigo-100">
            Descubra, empreste e explore nossa coleção de livros
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Catálogo de Livros</h2>
          <p className="text-gray-600">
            {totalBooks} livros • Página {currentPage} de {totalPages}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2"></div>
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
                        <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                          {book.categoria}
                        </span>
                      </p>
                      <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Cópias:</span> {book.numero_copias}
                      </p>
                    </div>

                    <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold">
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
                  {/* Previous Button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-indigo-100'
                    }`}
                  >
                    ← Anterior
                  </button>

                  {/* Page Numbers */}
                  {renderPageNumbers()}

                  {/* Next Button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-indigo-100'
                    }`}
                  >
                    Próxima →
                  </button>
                </div>

                {/* Page Info */}
                <p className="text-gray-600 text-sm">
                  Mostrando {(currentPage - 1) * booksPerPage + 1} - {Math.min(currentPage * booksPerPage, totalBooks)} de {totalBooks} livros
                </p>
              </div>
            )}
          </>
        )}

        {!loading && books.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Nenhum livro encontrado</p>
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
