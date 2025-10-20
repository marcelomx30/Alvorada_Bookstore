-- Books table matching your spreadsheet structure
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(500) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    numero_copias INTEGER DEFAULT 1,
    autor VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowers table
CREATE TABLE IF NOT EXISTS borrowers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table (tracks individual book copies being borrowed)
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id),
    borrower_id INTEGER REFERENCES borrowers(id),
    borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    returned_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    CONSTRAINT chk_status CHECK (status IN ('active', 'returned', 'overdue'))
);

-- Indexes for better performance
CREATE INDEX idx_books_categoria ON books(categoria);
CREATE INDEX idx_books_autor ON books(autor);
CREATE INDEX idx_loans_book_id ON loans(book_id);
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);

-- Insert your actual book data from the spreadsheet
INSERT INTO books (nome, categoria, numero_copias, autor) VALUES
    ('1984', 'Arte e Literatura', 1, 'George Orwell'),
    ('1808 - Como um País', 'História', 1, 'Laurentino Gomes'),
    ('1822 - Como um Homem', 'História', 1, 'Laurentino Gomes'),
    ('1889 - Como um Imperador', 'História', 1, 'Laurentino Gomes'),
    ('25 minutos - A vida de Franz', 'Biografia', 1, 'Franz Cariasco'),
    ('50 Anos em 5 - Minha vida', 'Biografia', 1, 'Juscelino Kubitschek'),
    ('9 ateus mudam de ideia', 'Leitura espiritual', 2, 'José Ramón Ayllón'),
    ('A ação do espírito santo', 'Leitura espiritual', 2, 'Alexis naud'),
    ('A alegria de crer', 'Leitura espiritual', 1, 'Francisco Jose de almeida'),
    ('A arte de aproveitar', 'Leitura espiritual', 1, 'Joseph Tissot'),
    ('A bondade', 'Leitura espiritual', 2, 'F. W. Faber'),
    ('A caminho de belém', 'Leitura espiritual', 2, 'Dorothy dohen'),
    ('A Cantiga dos pássaros', 'Arte e Literatura', 1, 'Suzanne Collins'),
    ('A cidade antiga', 'História', 1, 'Fustel de Coulanges'),
    ('A clara luz de Chiara', 'Biografia', 1, 'Michele Zanzucchi'),
    ('A cruz de Cristo', 'Leitura espiritual', 4, 'Francisco Fernández-Carvajal'),
    ('A Escalada Política', 'Biografia', 1, 'Juscelino Kubitschek'),
    ('A escrava Isaura', 'Arte e Literatura', 1, 'Bernardo Guimarães'),
    ('A família', 'Leitura espiritual', 1, 'Alípio maia e castro'),
    ('A filosofia e seus métodos', 'Filosofia', 2, 'Olavo De Carvalho'),
    ('A força do exemplo', 'Leitura espiritual', 2, 'Francico Faus'),
    ('A fraude da vinculação', 'Leitura espiritual', 1, 'Mark shea e edward sri'),
    ('A hora dos ruminantes', 'Arte e Literatura', 1, 'José J.Veiga'),
    ('A hora sexta', 'Leitura espiritual', 2, 'Jose Miguel Pero Sanz');

-- Sample borrowers
INSERT INTO borrowers (name, email, phone) VALUES
    ('João Silva', 'joao@example.com', '85999999999'),
    ('Maria Santos', 'maria@example.com', '85988888888'),
    ('Pedro Costa', 'pedro@example.com', '85977777777');
