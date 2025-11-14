import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ConfirmModal from '../../components/ConfirmModal'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ManageBooks() {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentBook, setCurrentBook] = useState(null)
  const [newBook, setNewBook] = useState({
    nome: '',
    autor: '',
    categoria: '',
    numero_copias: 1
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)
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
  fetchBooks()
}, [user, navigate, currentPage])  // Removed searchQuery

const fetchBooks = async () => {
  setLoading(true)
  try {
    const params = { page: currentPage, limit: 50 }
    if (searchQuery.trim()) {
      params.search = searchQuery
    }
    console.log('Fetching books with params:', params)  // ADD THIS
    const response = await axios.get('http://localhost:8080/api/books', {
      params,
      withCredentials: true
    })
    console.log('Response:', response.data)  // ADD THIS
    setBooks(response.data.books || [])
    setTotalPages(response.data.totalPages || 1)
    setTotalBooks(response.data.totalBooks || 0)
  } catch (error) {
    console.error('Error fetching books:', error)
    console.error('Error response:', error.response?.data)  // ADD THIS
    showToast('Erro ao carregar livros', 'error')
  } finally {
    setLoading(false)
  }
}

  const handleAddBook = async (e) => {
    e.preventDefault()
    console.log('Sending book data:', newBook)
    try {
      await axios.post('http://localhost:8080/api/admin/books', newBook, {  // Changed from /api/books
        withCredentials: true
      })
      showToast('Livro adicionado com sucesso!', 'success')
      setShowAddModal(false)
      setNewBook({ nome: '', autor: '', categoria: '', numero_copias: 1 })
      fetchBooks()
    } catch (error) {
      console.error('Error response:', error.response)
      showToast(error.response?.data || 'Erro ao adicionar livro', 'error')
    }
  }

  const handleEditBook = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`http://localhost:8080/api/admin/books/${currentBook.id}`, currentBook, {  // Changed
        withCredentials: true
      })
      showToast('Livro atualizado com sucesso!', 'success')
      setShowEditModal(false)
      setCurrentBook(null)
      fetchBooks()
    } catch (error) {
      showToast(error.response?.data || 'Erro ao atualizar livro', 'error')
    }
  }

  const handleDeleteBook = async (bookId, bookName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deletar Livro',
      message: `Tem certeza que deseja deletar "${bookName}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        try {
          await axios.delete(`http://localhost:8080/api/admin/books/${bookId}`, {  // Changed
            withCredentials: true
          })
          showToast('Livro deletado com sucesso!', 'success')
          fetchBooks()
        } catch (error) {
          showToast(error.response?.data || 'Erro ao deletar livro', 'error')
        }
      }
    })
  }

  const openEditModal = (book) => {
    setCurrentBook({ ...book })
    setShowEditModal(true)
  }

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
                    <a href="/admin/books" className="block px-4 py-2 text-alvorada-blue font-semibold bg-blue-50">📚 Gerenciar Livros</a>
                    <a href="/admin/rentals" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">📋 Gerenciar Aluguéis</a>
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
          <h1 className="text-4xl font-bold mb-2">⚙️ Gerenciar Livros</h1>
          <p className="text-xl text-blue-100">Adicionar, editar e remover livros do catálogo</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md">
            ➕ Adicionar Novo Livro
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por título, autor ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1)
                  fetchBooks()
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent"
            />          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <p className="text-gray-600">
            Mostrando <span className="font-semibold">{books.length}</span> livros desta página • Total: <span className="font-semibold">{totalBooks}</span> livros
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum livro encontrado</h3>
            <p className="text-gray-600">Adicione novos livros ao catálogo</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-alvorada-blue text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Autor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cópias</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Disponíveis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {books.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{book.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{book.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.autor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-block px-3 py-1 bg-alvorada-gold text-gray-800 rounded-full text-xs font-medium">
                            {book.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{book.total_copies}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${book.available_copies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {book.available_copies}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button onClick={() => openEditModal(book)} className="px-3 py-1 bg-alvorada-blue text-white rounded hover:bg-alvorada-blue-dark transition-colors font-semibold">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleDeleteBook(book.id, book.nome)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold">
                            🗑️ Deletar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center items-center gap-4 mb-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                ← Anterior
              </button>
              <span className="text-gray-700 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">➕ Adicionar Novo Livro</h2>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input required type="text" value={newBook.nome} onChange={(e) => setNewBook({...newBook, nome: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
                <input required type="text" value={newBook.autor} onChange={(e) => setNewBook({...newBook, autor: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <input required type="text" value={newBook.categoria} onChange={(e) => setNewBook({...newBook, categoria: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cópias *</label>
                <input required type="number" min="1" value={newBook.numero_copias} onChange={(e) => setNewBook({...newBook, numero_copias: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">Adicionar</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && currentBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">✏️ Editar Livro</h2>
            <form onSubmit={handleEditBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input required type="text" value={currentBook.nome} onChange={(e) => setCurrentBook({...currentBook, nome: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
                <input required type="text" value={currentBook.autor} onChange={(e) => setCurrentBook({...currentBook, autor: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <input required type="text" value={currentBook.categoria} onChange={(e) => setCurrentBook({...currentBook, categoria: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total de Cópias *</label>
                <input required type="number" min="1" value={currentBook.total_copies} onChange={(e) => setCurrentBook({...currentBook, total_copies: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-alvorada-blue text-white rounded-lg hover:bg-alvorada-blue-dark transition-colors font-semibold">Salvar</button>
                <button type="button" onClick={() => { setShowEditModal(false); setCurrentBook(null) }} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        confirmText="Deletar"
        cancelText="Cancelar"
        type="danger"
      />

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default ManageBooks
