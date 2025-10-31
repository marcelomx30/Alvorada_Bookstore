import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ManageBooks() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    autor: '',
    categoria: '',
    numero_copias: 1
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
    fetchBooks()
  }, [user, navigate])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8080/api/books?limit=1000')
      setBooks(response.data.books || [])
    } catch (error) {
      console.error('Error fetching books:', error)
      alert('Erro ao carregar livros')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBook = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8080/api/admin/books', formData, {
        withCredentials: true
      })
      alert('✅ Livro adicionado com sucesso!')
      setShowAddModal(false)
      setFormData({ nome: '', autor: '', categoria: '', numero_copias: 1 })
      fetchBooks()
    } catch (error) {
      alert(`❌ ${error.response?.data || 'Erro ao adicionar livro'}`)
    }
  }

  const handleEditBook = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`http://localhost:8080/api/admin/books/${editingBook.id}`, formData, {
        withCredentials: true
      })
      alert('✅ Livro atualizado com sucesso!')
      setShowEditModal(false)
      setEditingBook(null)
      setFormData({ nome: '', autor: '', categoria: '', numero_copias: 1 })
      fetchBooks()
    } catch (error) {
      alert(`❌ ${error.response?.data || 'Erro ao atualizar livro'}`)
    }
  }

  const handleDeleteBook = async (bookId, bookName) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${bookName}"?`)) {
      return
    }
    try {
      await axios.delete(`http://localhost:8080/api/admin/books/${bookId}`, {
        withCredentials: true
      })
      alert('✅ Livro deletado com sucesso!')
      fetchBooks()
    } catch (error) {
      alert(`❌ ${error.response?.data || 'Erro ao deletar livro'}`)
    }
  }

  const openEditModal = (book) => {
    setEditingBook(book)
    setFormData({
      nome: book.nome,
      autor: book.autor,
      categoria: book.categoria,
      numero_copias: book.numero_copias
    })
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
              <span className="text-xl font-bold text-gray-800">Biblioteca Alvorada - Admin</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📚 Catálogo</a>
              <a href="/my-rentals" className="text-gray-700 hover:text-alvorada-blue transition-colors font-medium">📖 Meus Aluguéis</a>
              <a href="/admin/books" className="text-alvorada-blue font-semibold border-b-2 border-alvorada-blue">⚙️ Gerenciar Livros</a>
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

      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-2">⚙️ Gerenciar Livros</h1>
          <p className="text-xl text-purple-100">Adicionar, editar e remover livros do catálogo</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md">➕ Adicionar Novo Livro</button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cópias</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponíveis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">{book.nome}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.autor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.categoria}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.numero_copias}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{book.available_copies}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={() => openEditModal(book)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">✏️ Editar</button>
                        <button onClick={() => handleDeleteBook(book.id, book.nome)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">🗑️ Deletar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">➕ Adicionar Novo Livro</h2>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" required value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input type="text" required value={formData.autor} onChange={(e) => setFormData({...formData, autor: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input type="text" required value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cópias</label>
                <input type="number" required min="1" value={formData.numero_copias} onChange={(e) => setFormData({...formData, numero_copias: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">Adicionar</button>
                <button type="button" onClick={() => {setShowAddModal(false); setFormData({nome: '', autor: '', categoria: '', numero_copias: 1})}} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">✏️ Editar Livro</h2>
            <form onSubmit={handleEditBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input type="text" required value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
                <input type="text" required value={formData.autor} onChange={(e) => setFormData({...formData, autor: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input type="text" required value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cópias</label>
                <input type="number" required min="1" value={formData.numero_copias} onChange={(e) => setFormData({...formData, numero_copias: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">Salvar</button>
                <button type="button" onClick={() => {setShowEditModal(false); setEditingBook(null); setFormData({nome: '', autor: '', categoria: '', numero_copias: 1})}} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 Biblioteca Alvorada - Sistema de Gestão de Livros</p>
        </div>
      </footer>
    </div>
  )
}

export default ManageBooks


