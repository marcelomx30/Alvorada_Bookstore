import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ManageUsers() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [userHistory, setUserHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
    fetchUsers()
  }, [user, navigate])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filterRole, filterStatus, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8080/api/admin/users', {
        withCredentials: true
      })
      setUsers(response.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.toLowerCase().includes(query)
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole)
    }

    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active'
      filtered = filtered.filter(u => u.is_active === isActive)
    }

    setFilteredUsers(filtered)
  }

  const handleToggleStatus = async (userId, userName, currentStatus) => {
    const action = currentStatus ? 'desativar' : 'ativar'
    if (!window.confirm(`Deseja ${action} o usuário "${userName}"?`)) {
      return
    }

    try {
      await axios.put(`http://localhost:8080/api/admin/users/${userId}/toggle`, {}, {
        withCredentials: true
      })
      alert(`✅ Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`)
      fetchUsers()
    } catch (error) {
      alert(`❌ ${error.response?.data || 'Erro ao alterar status do usuário'}`)
    }
  }

  const fetchUserHistory = async (userId, userName) => {
    setSelectedUser({ id: userId, name: userName })
    setShowHistoryModal(true)
    setLoadingHistory(true)
    try {
      const response = await axios.get(`http://localhost:8080/api/admin/users/${userId}/rentals`, {
        withCredentials: true
      })
      setUserHistory(response.data || [])
    } catch (error) {
      console.error('Error fetching user history:', error)
      alert('Erro ao carregar histórico do usuário')
    } finally {
      setLoadingHistory(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status) => {
    if (status === 'returned') return 'bg-green-100 text-green-800'
    if (status === 'active') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    if (status === 'returned') return 'Devolvido'
    if (status === 'active') return 'Ativo'
    return status
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const activeCount = users.filter(u => u.is_active).length
  const inactiveCount = users.filter(u => !u.is_active).length

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
                    <a href="/admin/rentals" className="block px-4 py-2 text-gray-700 hover:bg-alvorada-blue hover:text-white transition-colors">📋 Gerenciar Aluguéis</a>
                    <a href="/admin/users" className="block px-4 py-2 text-alvorada-blue font-semibold bg-blue-50">👥 Gerenciar Usuários</a>
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
          <p className="text-xl text-blue-100">Visualizar e gerenciar contas de usuários</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Administradores</p>
                <p className="text-3xl font-bold text-purple-600">{adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">👑</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ativos</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Inativos</p>
                <p className="text-3xl font-bold text-red-600">{inactiveCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">❌</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-alvorada-blue focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por:</h3>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Tipo:</label>
              <div className="flex gap-2">
                <button onClick={() => setFilterRole('all')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterRole === 'all' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos</button>
                <button onClick={() => setFilterRole('admin')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterRole === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Admin</button>
                <button onClick={() => setFilterRole('user')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterRole === 'user' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Usuário</button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Status:</label>
              <div className="flex gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'all' ? 'bg-alvorada-blue text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos</button>
                <button onClick={() => setFilterStatus('active')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'active' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ativos</button>
                <button onClick={() => setFilterStatus('inactive')} className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === 'inactive' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Inativos</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <p className="text-gray-600">
            Mostrando <span className="font-semibold">{filteredUsers.length}</span> de <span className="font-semibold">{users.length}</span> usuários
            {searchQuery && ` • Filtrados por: "${searchQuery}"`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-alvorada-blue"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou a busca</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-alvorada-blue text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Aluguéis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {u.role === 'admin' ? '👑 Admin' : '👤 Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{u.active_rentals}</span> / {u.total_rentals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {u.is_active ? '✅ Ativo' : '❌ Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => fetchUserHistory(u.id, u.name)}
                          className="px-3 py-1 bg-alvorada-blue text-white rounded hover:bg-alvorada-blue-dark transition-colors font-semibold"
                        >
                          📋 Histórico
                        </button>
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.name, u.is_active)}
                            className={`px-3 py-1 text-white rounded transition-colors font-semibold ${u.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                            {u.is_active ? '🚫 Desativar' : '✅ Ativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📋 Histórico de Aluguéis - {selectedUser?.name}</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alvorada-blue"></div>
              </div>
            ) : userHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-gray-600">Este usuário ainda não tem aluguéis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userHistory.map((rental) => (
                  <div key={rental.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{rental.book_name}</h3>
                        <p className="text-sm text-gray-600">{rental.book_author}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(rental.status)}`}>
                        {getStatusText(rental.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-gray-500">Alugado em</p>
                        <p className="font-semibold">{formatDate(rental.rented_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Devolução</p>
                        <p className="font-semibold">{formatDate(rental.due_date)}</p>
                      </div>
                      {rental.returned_at && (
                        <div>
                          <p className="text-gray-500">Devolvido em</p>
                          <p className="font-semibold text-green-600">{formatDate(rental.returned_at)}</p>
                        </div>
                      )}
                    </div>
                    {rental.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="font-semibold">Obs:</span> {rental.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

export default ManageUsers
