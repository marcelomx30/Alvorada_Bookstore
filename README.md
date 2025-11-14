# Biblioteca Alvorada - Library Management System

A full-stack web application for managing library operations including book catalog, user rentals, and administrative functions. Built to demonstrate proficiency in modern web development technologies and best practices.

![Status](https://img.shields.io/badge/Status-Active-success) ![Go](https://img.shields.io/badge/Go-1.21+-00ADD8) ![React](https://img.shields.io/badge/React-18+-61DAFB) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Project Overview

Biblioteca Alvorada is a production-ready library management system managing 437+ books with complete CRUD operations, user authentication, and role-based access control. The application demonstrates end-to-end full-stack development capabilities from database design to responsive frontend implementation.

## Core Features

### Book Catalog Management
- Paginated catalog with 50 items per page
- Advanced search functionality across titles, authors, and categories
- Category-based filtering
- Real-time inventory tracking
- Responsive grid layout

### Authentication & Authorization
- Session-based authentication with bcrypt password hashing
- Role-based access control (User/Administrator)
- User registration with validation
- Persistent sessions using HTTP-only cookies

### Rental System
- Rental creation and tracking
- Automated due date calculation
- Return processing
- Complete rental history
- Overdue detection
- Status management (Active, Returned, Overdue)

### Administration Panel
- Book inventory management (Create, Read, Update, Delete)
- User account management
- Rental oversight across all users
- System analytics and metrics
- Comprehensive search and filtering

### User Interface
- Fully responsive design
- Custom modal dialogs
- Toast notifications
- Mobile-optimized controls
- Consistent brand styling

## Technology Stack

### Backend
- **Go 1.21+** - Server-side application logic
- **Gorilla Mux** - HTTP routing
- **PostgreSQL 16** - Relational database
- **bcrypt** - Password hashing
- **CORS** - Cross-origin configuration

### Frontend
- **React 18** - UI framework
- **React Router Dom 6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS 3** - Styling framework
- **Vite** - Build tool
- **Context API** - State management

### Infrastructure
- **Docker** - Database containerization
- **Docker Compose** - Service orchestration

## Project Structure
```
Alvorada_Bookstore/
├── backend/
│   ├── main.go              # Server implementation and API endpoints
│   ├── go.mod               # Go dependencies
│   └── go.sum               # Dependency checksums
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # Global state management
│   │   ├── pages/           # Route components
│   │   └── admin/           # Administrative interfaces
│   ├── package.json         # Node dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── vite.config.js       # Vite configuration
├── docker-compose.yml       # Docker services
└── README.md
```

## Installation

### Requirements

- Go 1.21 or higher
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Setup Instructions

**1. Clone Repository**
```bash
git clone https://github.com/yourusername/Alvorada_Bookstore.git
cd Alvorada_Bookstore
```

**2. Start Database**
```bash
docker-compose up -d
```

**3. Initialize Database Schema**
```bash
docker exec -it alvorada-library-db psql -U library -d alvorada_library
```

Execute the following SQL:
```sql
-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(500) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    numero_copias INTEGER DEFAULT 1,
    disponivel INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_books_categoria ON books(categoria);
CREATE INDEX idx_books_autor ON books(autor);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rentals table
CREATE TABLE IF NOT EXISTS rentals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    rented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT
);

CREATE INDEX idx_rentals_user ON rentals(user_id);
CREATE INDEX idx_rentals_book ON rentals(book_id);
CREATE INDEX idx_rentals_status ON rentals(status);

-- Default admin account (password: admin123)
INSERT INTO users (name, email, phone, password_hash, role, is_active) 
VALUES (
    'Administrator',
    'admin@alvorada.com',
    '(85) 99999-9999',
    '$2a$10$rF8qXVPGf5VbLZY5kN.kPOKP7YvZ8qYH9qN9Xj5KxWLZvK8Nj5KxW',
    'admin',
    true
);
```

Exit with `\q`

**4. Start Backend**
```bash
cd backend
go mod download
go run main.go
```

Backend runs on `http://localhost:8080`

**5. Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

**6. Access Application**

Navigate to `http://localhost:5173`

Default admin credentials:
- Email: `admin@alvorada.com`
- Password: `admin123`

## Database Schema

### Books
```sql
id              SERIAL PRIMARY KEY
nome            VARCHAR(500)        -- Book title
autor           VARCHAR(255)        -- Author
categoria       VARCHAR(100)        -- Category
numero_copias   INTEGER            -- Total copies
disponivel      INTEGER            -- Available copies
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Users
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(255)
email           VARCHAR(255) UNIQUE
phone           VARCHAR(20)
password_hash   VARCHAR(255)
role            VARCHAR(50)        -- 'user' or 'admin'
is_active       BOOLEAN
created_at      TIMESTAMP
```

### Rentals
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER FK -> users(id)
book_id         INTEGER FK -> books(id)
rented_at       TIMESTAMP
due_date        TIMESTAMP
returned_at     TIMESTAMP
status          VARCHAR(50)        -- 'active', 'returned', 'overdue'
notes           TEXT
```

## Security Implementation

- Password hashing using bcrypt (cost factor 10)
- Session-based authentication with HTTP-only cookies
- Role-based access control for administrative functions
- CORS configuration for development environment
- Parameterized SQL queries to prevent injection attacks
- Protected API endpoints requiring authentication

## API Documentation

### Authentication

**POST** `/api/auth/register` - Register new user  
**POST** `/api/auth/login` - Authenticate user  
**POST** `/api/auth/logout` - End session  
**GET** `/api/auth/me` - Get current user

### Books

**GET** `/api/books?page=1&limit=50&search=query` - List books (paginated)  
**GET** `/api/books/:id` - Get single book  
**GET** `/api/books/category/:category` - Filter by category  
**GET** `/api/categories` - List all categories

### Rentals

**POST** `/api/rentals` - Create rental  
**GET** `/api/rentals/my` - Get user's rentals  
**PUT** `/api/rentals/:id/return` - Return book

### Admin (Protected)

**POST** `/api/admin/books` - Add book  
**PUT** `/api/admin/books/:id` - Update book  
**DELETE** `/api/admin/books/:id` - Delete book  
**GET** `/api/admin/users` - List users  
**PUT** `/api/admin/users/:id/toggle` - Toggle user status  
**GET** `/api/admin/rentals` - List all rentals  
**POST** `/api/admin/rentals` - Create rental for user

## Technical Highlights

### Backend Architecture
- RESTful API design principles
- Middleware for authentication and authorization
- Efficient database queries with indexes
- Pagination implementation for large datasets
- Error handling and logging
- CORS middleware for cross-origin requests

### Frontend Architecture
- Component-based architecture with React Hooks
- Global state management using Context API
- Protected routes with authentication checks
- Responsive design implementation
- Custom reusable components
- Axios interceptors for request/response handling

### Database Design
- Normalized schema (3NF)
- Foreign key constraints
- Indexed columns for query optimization
- Cascade delete configurations
- Timestamp tracking for audit trails

## Development Approach

This project was built with emphasis on understanding core concepts:

**Backend Development**
- RESTful API design and implementation
- Database schema design with relationships
- SQL query optimization
- Session-based authentication
- Password security with bcrypt
- Error handling strategies
- Pagination logic

**Frontend Development**
- React Hooks (useState, useEffect, useContext)
- Component composition
- Client-side routing
- HTTP request handling
- Form validation
- Responsive design
- State management

**Full-Stack Integration**
- API contract design
- Session management
- CRUD operation flows
- Error propagation
- Loading states
- Real-time data synchronization

## Future Enhancements

- Configurable rental periods and user limits
- Email notification system
- Book cover image management
- Advanced reporting and analytics
- Export functionality (PDF/Excel)
- QR code integration
- Book reservation system
- Multi-language support
- Mobile application

## Troubleshooting

**Database Connection Issues**
```bash
docker ps | grep alvorada
docker logs alvorada-library-db
docker-compose restart
```

**Backend Issues**
```bash
go version  # Verify Go 1.21+
go mod verify
go clean && go build
```

**Frontend Issues**
```bash
rm -rf node_modules package-lock.json
npm install
rm -rf node_modules/.vite
npm run dev
```

**Port Conflicts**
```bash
lsof -i :8080
kill -9 <PID>
```

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Push to your branch
5. Open a Pull Request

### Code Standards
- Go: Follow standard Go formatting
- JavaScript: Follow Airbnb style guide
- CSS: Use Tailwind utility classes
- Commits: Use conventional commit messages

## License

MIT License

Copyright (c) 2025 Marcelo Meireles Marques Filho

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Author

**Marcelo Meireles Marques Filho**

Email: marcelomx30@alu.ufc.br  
LinkedIn:[Marcelo Marques](https://www.linkedin.com/in/marcelomx30/) 
GitHub: [@marcelomx30](https://github.com/marcelomx30)

## Acknowledgments

Development Environment: Omarchy Linux (Arch + Hyprland)  
Tools: LazyVim, Mise  
Location: Fortaleza, Brazil

---

**This project demonstrates practical application of modern web development technologies and software engineering principles.**
