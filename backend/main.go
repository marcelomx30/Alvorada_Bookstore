package main

import(
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
	
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var (
	db       *sql.DB 
	sessions = make(map[string]*Session)
	mu       sync.RWMutex
)

type BookResponse struct{
	Message string 	`json:"message"`
	Total int `json:"total"`
}

type CategoryCount struct{
	Categoria string `json:"Categoria"`
	Count int `json:"count"`
}

type Book struct{
	ID int `json:"id"`
	Nome string `json:"nome"`
	Categoria string `json:"categoria"`
	Autor string `json:"autor"`
	NumeroCopias int `json:"numero_copias"`
	Available int `json:"available_copies"`

}

type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}


type Rental struct {
    ID               int       `json:"id"`
    UserID           int       `json:"user_id"`
    BookID           int       `json:"book_id"`
    RentedAt         time.Time `json:"rented_at"`
    DueDate          string    `json:"due_date"`
    ReturnedAt       *time.Time `json:"returned_at"`
    Status           string    `json:"status"`
    RentedByAdminID  *int      `json:"rented_by_admin_id"`
    Notes            string    `json:"notes"`
}

type RentalWithBook struct {
	Rental
	BookName     string `json:"book_name"`
	BookAuthor   string `json:"book_author"`
	BookCategory string `json:"book_category"`
}

type CreateBookRequest struct {
	Nome string `json:"nome"`
	Autor string `json:"autor"`
	Categoria string `json:"categoria"`
	NumeroCopias int `json:"numero_copias"`
}

type UpdateBookRequest struct {
	Nome string `json:"nome"`
	Autor string `json:"autor"`
	Categoria string `json:"categoria"`
	NumeroCopias int `json:"numero_copias"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Session struct {
	UserID int
	Email  string
	Role   string
}

// Generate random session ID
func generateSessionID() string {
	b := make([]byte, 32)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

// Get session from cookie
func getSession(req *http.Request) *Session {
	cookie, err := req.Cookie("session_id")
	if err != nil {
		return nil
	}
	
	mu.RLock()
	defer mu.RUnlock()
	return sessions[cookie.Value]
}

// Create session and set cookie
func createSession(w http.ResponseWriter, user *User) string {
	sessionID := generateSessionID()
	
	session := &Session{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
	}
	
	mu.Lock()
	sessions[sessionID] = session
	mu.Unlock()
	
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	
	return sessionID
}

// Delete session (logout)
func deleteSession(w http.ResponseWriter, req *http.Request) {
	cookie, err := req.Cookie("session_id")
	if err != nil {
		return
	}
	
	mu.Lock()
	delete(sessions, cookie.Value)
	mu.Unlock()
	
	http.SetCookie(w, &http.Cookie{
		Name:   "session_id",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
}

func register(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var regReq RegisterRequest
	err := json.NewDecoder(req.Body).Decode(&regReq)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Validate input
	if regReq.Name == "" || regReq.Email == "" || regReq.Phone == "" || regReq.Password == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}
	
	if len(regReq.Password) < 6 {
		http.Error(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}
	
	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(regReq.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error processing password", http.StatusInternalServerError)
		return
	}
	
	// Insert user into database
	var userID int
	err = db.QueryRow(`
		INSERT INTO users (name, email, phone, password_hash, role)
		VALUES ($1, $2, $3, $4, 'user')
		RETURNING id
	`, regReq.Name, regReq.Email, regReq.Phone, string(passwordHash)).Scan(&userID)
	
	if err != nil {
		// Check if email already exists
		if err.Error() == `pq: duplicate key value violates unique constraint "users_email_key"` {
			http.Error(w, "Email already registered", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Create user object
	user := &User{
		ID:    userID,
		Name:  regReq.Name,
		Email: regReq.Email,
		Phone: regReq.Phone,
		Role:  "user",
	}
	
	// Create session
	createSession(w, user)
	
	// Return user info
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Registration successful",
		"user":    user,
	})
}

func login(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	var loginReq LoginRequest
	err := json.NewDecoder(req.Body).Decode(&loginReq)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Get user from database
	var user User
	err = db.QueryRow(`
		SELECT id, name, email, phone, password_hash, role, is_active, created_at
		FROM users
		WHERE email = $1
	`, loginReq.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, 
		&user.PasswordHash, &user.Role, &user.IsActive, &user.CreatedAt)
	
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Check if user is active
	if !user.IsActive {
		http.Error(w, "Account is disabled", http.StatusForbidden)
		return
	}
	
	// Compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(loginReq.Password))
	if err != nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}
	
	// Create session
	createSession(w, &user)
	
	// Return user info
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Login successful",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"phone": user.Phone,
			"role":  user.Role,
		},
	})
}

func logout(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	deleteSession(w, req)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logged out successfully",
	})
}

func getCurrentUser(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	session := getSession(req)
	if session == nil {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}
	
	// Get fresh user data from database
	var user User
	err := db.QueryRow(`
		SELECT id, name, email, phone, role, is_active, created_at
		FROM users
		WHERE id = $1
	`, session.UserID).Scan(&user.ID, &user.Name, &user.Email, &user.Phone,
		&user.Role, &user.IsActive, &user.CreatedAt)
	
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	
	json.NewEncoder(w).Encode(user)
}


func getPaginationParams(req *http.Request)(pageNum int, limit int, offset int){
	page := req.URL.Query().Get("page")
	limitStr := req.URL.Query().Get("limit")

	pageNum = 1
	limit = 20

	if page != "" {
		if p, err := strconv.Atoi(page); err == nil && p>0 {
			pageNum = p
		}
	}

	if limitStr != ""{
		if l, err := strconv.Atoi(limitStr); err == nil && l>0 && l<= 10000 {
			limit = l
		}
	}
	offset = (pageNum - 1) * limit
	return pageNum, limit, offset
}

func createPaginatedResponse(books []Book, pageNum int, totalBooks int, limit int, additionalData map[string]interface{}) map[string]interface{} {
	totalPages := (totalBooks + limit - 1) / limit

	response := map[string]interface{}{
		"books" : books,
		"currentPage": pageNum, 
		"totalPages": totalPages, 
		"totalBooks": totalBooks,
		"limit": limit, 
	}

	for key, value := range additionalData{
		response[key] = value
	}
	return response
 }


func getBook(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(req)
	id := vars["id"]
	
	query := `
		SELECT 
			b.id, b.nome, b.categoria, b.numero_copias, b.autor,
			b.numero_copias - COALESCE((
				SELECT COUNT(*) FROM rentals r 
				WHERE r.book_id = b.id AND r.status = 'active'
			), 0) as available_copies
		FROM books b
		WHERE b.id = $1
	`
	
	var book Book
	err := db.QueryRow(query, id).Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor, &book.Available)

	if err == sql.ErrNoRows {
		http.Error(w, "Book NOT FOUND", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(book)
}


func searchByCategory(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")
	pageNum, limit, offset := getPaginationParams(req)
	vars := mux.Vars(req)

	category := vars["category"]
	if category == ""{
		http.Error(w, "Category is required", http.StatusBadRequest)
		return
	}
	
	var totalBooks int
	err := db.QueryRow("SELECT COUNT(*) FROM books WHERE categoria = $1", category).Scan(&totalBooks)
	if err != nil{
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	query := `
		SELECT 
			b.id, b.nome, b.categoria, b.numero_copias, b.autor,
			b.numero_copias - COALESCE((
				SELECT COUNT(*) FROM rentals r 
				WHERE r.book_id = b.id AND r.status = 'active'
			), 0) as available_copies
		FROM books b 
		WHERE categoria = $1 
		ORDER BY nome 
		LIMIT $2 OFFSET $3
	`
	rows, err := db.Query(query, category, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	books := []Book{}
	for rows.Next(){
		var book Book
		err := rows.Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor, &book.Available)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		books = append(books, book)
	}
	additionalData := map[string]interface{}{
		"category": category,
	}
	response := createPaginatedResponse(books, pageNum, totalBooks, limit, additionalData)
	json.NewEncoder(w).Encode(response)	
}

func getBooks(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	// Use helper function for pagination
	pageNum, limit, offset := getPaginationParams(req)
	
	// Get total count
	var totalBooks int
	err := db.QueryRow("SELECT COUNT(*) FROM books").Scan(&totalBooks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Get paginated books
query := `
	SELECT 
		b.id, 
		b.nome, 
		b.categoria, 
		b.autor,
		b.numero_copias,
		b.numero_copias - COALESCE((
			SELECT COUNT(*) 
			FROM rentals r 
			WHERE r.book_id = b.id AND r.status = 'active'
		), 0) as available_copies
	FROM books b 
	ORDER BY b.nome 
	LIMIT $1 OFFSET $2
`
	rows, err := db.Query(query, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	books := []Book{}
	for rows.Next() {
		var book Book
		err := rows.Scan(&book.ID, &book.Nome, &book.Categoria, &book.Autor, &book.NumeroCopias, &book.Available)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		books = append(books, book)
	}
	
	// Use helper function to create response
	response := createPaginatedResponse(books, pageNum, totalBooks, limit, nil)
	json.NewEncoder(w).Encode(response)
}

func getCategories(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")
	
	query := `SELECT categoria, COUNT(*) as count FROM books GROUP BY categoria ORDER BY COUNT(*) DESC`

	rows, err := db.Query(query)
	if err !=nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
defer rows.Close()

categories := []CategoryCount{}

for rows.Next(){
	var cat CategoryCount
	err := rows.Scan(&cat.Categoria, &cat.Count)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	categories = append(categories, cat)
}

json.NewEncoder(w).Encode(categories)

}


func searchBooks(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")
	
	// Get search parameters
	searchQuery := req.URL.Query().Get("q")
	searchType := req.URL.Query().Get("type")
	
	if searchQuery == "" {
		http.Error(w, "Search Query 'q' is required", http.StatusBadRequest)
		return
	}
	
	// Use helper function for pagination
	pageNum, limit, offset := getPaginationParams(req)
	
	// Build SQL query
	var query string
	var countQuery string
	var args []interface{}
	
	searchPattern := "%" + searchQuery + "%"
	
	switch searchType {
	case "author":
		query = `
			SELECT 
				b.id, b.nome, b.categoria, b.autor, b.numero_copias,
				b.numero_copias - COALESCE((
					SELECT COUNT(*) FROM rentals r 
					WHERE r.book_id = b.id AND r.status = 'active'
				), 0) as available_copies
			FROM books b 
			WHERE autor ILIKE $1 
			ORDER BY nome 
			LIMIT $2 OFFSET $3
		`
		countQuery = "SELECT COUNT(*) FROM books WHERE autor ILIKE $1"
		args = []interface{}{searchPattern, limit, offset}
		
	case "title":
		query = `
			SELECT 
				b.id, b.nome, b.categoria, b.autor, b.numero_copias,
				b.numero_copias - COALESCE((
					SELECT COUNT(*) FROM rentals r 
					WHERE r.book_id = b.id AND r.status = 'active'
				), 0) as available_copies
			FROM books b 
			WHERE nome ILIKE $1 
			ORDER BY nome 
			LIMIT $2 OFFSET $3
		`
		countQuery = "SELECT COUNT(*) FROM books WHERE nome ILIKE $1"
		args = []interface{}{searchPattern, limit, offset}
		
	default:
		query = `
			SELECT 
				b.id, b.nome, b.categoria, b.autor, b.numero_copias,
				b.numero_copias - COALESCE((
					SELECT COUNT(*) FROM rentals r 
					WHERE r.book_id = b.id AND r.status = 'active'
				), 0) as available_copies
			FROM books b 
			WHERE nome ILIKE $1 OR autor ILIKE $1 
			ORDER BY nome 
			LIMIT $2 OFFSET $3
		`
		countQuery = "SELECT COUNT(*) FROM books WHERE nome ILIKE $1 OR autor ILIKE $1"
		args = []interface{}{searchPattern, limit, offset}
	}
	
	var totalBooks int
	err := db.QueryRow(countQuery, searchPattern).Scan(&totalBooks)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Execute search query
	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	// Collect results
	books := []Book{}
	for rows.Next() {
		var book Book
		err := rows.Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor, &book.Available)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		books = append(books, book)
	}
	
	// Use helper function to create response with additional search data
	additionalData := map[string]interface{}{
		"searchQuery": searchQuery,
		"searchType":  searchType,
	}
	response := createPaginatedResponse(books, pageNum, totalBooks, limit, additionalData)
	
	json.NewEncoder(w).Encode(response)
}

func rentBook(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")
	session := getSession(req)
	if session == nil {
		http.Error(w, "Not Authenticated", http.StatusUnauthorized)
		return
	}

	UserID := session.UserID

	type RentBookRequest struct {
  	  BookID int    `json:"book_id"`
   	 	Notes  string `json:"notes"`
	}

	var rentReq RentBookRequest
	err := json.NewDecoder(req.Body).Decode(&rentReq)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
    return
	}

	var totalCopies int
	err = db.QueryRow("SELECT numero_copias FROM books WHERE id = $1", rentReq.BookID).Scan(&totalCopies)
	if err != nil {
  	  if err == sql.ErrNoRows {
				http.Error(w, "Book NOT FOUND", http.StatusNotFound)
   	    return
    	}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var rentedCount int
	err = db.QueryRow(
  	"SELECT COUNT(*) FROM rentals WHERE book_id = $1 AND status = $2",
    rentReq.BookID, "active",
	).Scan(&rentedCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
  	return
	}

	available := totalCopies - rentedCount
	if available <= 0 {
    http.Error(w, "No copies available for this book", http.StatusConflict)	
  	return
	}

	var currentRentals int
	err = db.QueryRow(
		"SELECT COUNT(*) FROM rentals WHERE user_id = $1 AND status = $2",
		UserID, "active",
	).Scan(&currentRentals)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var maxBooksStr string
	err = db.QueryRow(
		"SELECT value FROM system_config WHERE key = $1",
		"max_books_per_user",
	).Scan(&maxBooksStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	maxBooks, err := strconv.Atoi(maxBooksStr)
	if err != nil {
		http.Error(w, "Invalid configuration", http.StatusInternalServerError)
		return
	}

	if currentRentals >= maxBooks {
		http.Error(w, fmt.Sprintf("You have reached the maximum number of books (%d)", maxBooks), http.StatusForbidden)
		return
	}

	var rentalPeriodStr string
	err = db.QueryRow(
		"SELECT value FROM system_config WHERE key = $1",
		"rental_period_days",
	).Scan(&rentalPeriodStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rentalPeriod, err := strconv.Atoi(rentalPeriodStr)
	if err != nil {
		http.Error(w, "Invalid configuration", http.StatusInternalServerError)
		return
	}


	dueDate := time.Now().AddDate(0, 0, rentalPeriod)
	dueDateStr := dueDate.Format("2006-01-02")

	var rentalID int
	err = db.QueryRow(`
		INSERT INTO rentals (user_id, book_id, due_date, notes)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, UserID, rentReq.BookID, dueDateStr, rentReq.Notes).Scan(&rentalID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message": "Book rented successfully",
		"rental": map[string]interface{}{
		"id":       rentalID,
		"book_id":  rentReq.BookID,
		"due_date": dueDateStr,
		"status":   "active",
	},
	}
	json.NewEncoder(w).Encode(response)
}

func getMyRentals(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	session := getSession(req)
	if session == nil {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}
	
	userID := session.UserID
	
	query := `
		SELECT 
			r.id, r.user_id, r.book_id, r.rented_at, r.due_date, 
			r.returned_at, r.status, r.rented_by_admin_id, r.notes,
			b.nome, b.autor, b.categoria
		FROM rentals r
		JOIN books b ON r.book_id = b.id
		WHERE r.user_id = $1
		ORDER BY r.rented_at DESC
	`
	
	rows, err := db.Query(query, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	rentals := []RentalWithBook{}
	
	for rows.Next() {
		var rental RentalWithBook
		err := rows.Scan(
			&rental.ID, &rental.UserID, &rental.BookID, &rental.RentedAt, &rental.DueDate,
			&rental.ReturnedAt, &rental.Status, &rental.RentedByAdminID, &rental.Notes,
			&rental.BookName, &rental.BookAuthor, &rental.BookCategory,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rentals = append(rentals, rental)
	}
	
	json.NewEncoder(w).Encode(rentals)
}

func returnBook(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")

	session := getSession(req)
	if session == nil {
		http.Error(w, "Not Authenticated", http.StatusUnauthorized)
		return
	}
	
	userID := session.UserID

	vars := mux.Vars(req)
	rentalIDStr := vars["id"]
	rentalID, err := strconv.Atoi(rentalIDStr)
	if err != nil{
		http.Error(w, "Invalid Rental ID", http.StatusBadRequest)
		return
	}

	var rental Rental
	err = db.QueryRow(`
	SELECT id, user_id, book_id, status
	FROM rentals 
	WHERE id = $1
	`, rentalID).Scan(&rental.ID, &rental.UserID, &rental.BookID, &rental.Status)

	if err != nil {
		if err == sql.ErrNoRows{
			http.Error(w, "Rental Not Found", http.StatusNotFound)
			return
		}
	http.Error(w, err.Error(), http.StatusInternalServerError)
	return
	}	

	if rental.UserID != userID && session.Role != "admin"{
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	if rental.Status == "returned"{
	http.Error(w, "Book Already Returned", http.StatusBadRequest)
	return
	}

	_, err = db.Exec(`
	UPDATE rentals 
	SET status = 'returned', returned_at = CURRENT_TIMESTAMP
	WHERE id = $1
	`, rentalID)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message" : "Book returned successfully",
		"rental_id" : rentalID,
	})
}

func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request){
		session := getSession(req)
		if session == nil {
			http.Error(w, "Not Authenticated", http.StatusUnauthorized)
			return
		}
		if session.Role != "admin"{
			http.Error(w, "Forbidden: Admin Access required", http.StatusForbidden)
			return
		}
		next(w, req)
	}
}

func addBook(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")

	var bookReq CreateBookRequest
	err:= json.NewDecoder(req.Body).Decode(&bookReq)
	if err != nil{
		http.Error(w, "Invalid Request Body", http.StatusBadRequest)
		return
	}

	// Debug: Print what we received
	fmt.Printf("Received book request: %+v\n", bookReq)
	
	// Validate required fields
	if bookReq.Nome == "" {
		http.Error(w, "Nome is required", http.StatusBadRequest)
		return
	}

	if bookReq.Nome == "" {
		http.Error(w, "Nome is required", http.StatusBadRequest)
		return
	}

	if bookReq.Autor == "" {
		http.Error(w, "Autor is required", http.StatusBadRequest)
		return
	}

	if bookReq.Categoria == "" {
		http.Error(w, "Categoria is required", http.StatusBadRequest)
		return
	}

	if bookReq.NumeroCopias < 1 {
		http.Error(w, "Number of copies must be at least 1", http.StatusBadRequest)
		return
	}

	var bookID int
	err = db.QueryRow(`INSERT INTO books (nome, autor, categoria, numero_copias) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id
		`, bookReq.Nome, bookReq.Autor, bookReq.Categoria, bookReq.NumeroCopias).Scan(&bookID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	createdBook := Book{
		ID:           bookID,
		Nome:         bookReq.Nome,
		Autor:        bookReq.Autor,
		Categoria:    bookReq.Categoria,
		NumeroCopias: bookReq.NumeroCopias,
		Available:    bookReq.NumeroCopias,
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
	"message": "Book added successfully",
	"book":    createdBook,
})
}

func updateBook(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(req)
	bookID := vars["id"]

	var bookReq UpdateBookRequest
	err := json.NewDecoder(req.Body).Decode(&bookReq)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if bookReq.Nome == "" {
		http.Error(w, "Nome is required", http.StatusBadRequest)
		return
	}
	if bookReq.Autor == "" {
		http.Error(w, "Autor is required", http.StatusBadRequest)
		return
	}
	if bookReq.Categoria == "" {
		http.Error(w, "Categoria is required", http.StatusBadRequest)
		return
	}
	if bookReq.NumeroCopias < 1 {
		http.Error(w, "Numero de copias must be at least 1", http.StatusBadRequest)
		return
	}

	var exists bool
	err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM books WHERE id = $1)", bookID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Book NOT Found", http.StatusNotFound)
		return
	}

		_, err = db.Exec(`
		UPDATE books 
		SET nome = $1, autor = $2, categoria = $3, numero_copias = $4 
		WHERE id = $5
	`, bookReq.Nome, bookReq.Autor, bookReq.Categoria, bookReq.NumeroCopias, bookID)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Book updated successfully",
	})
}

func deleteBook(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	vars := mux.Vars(req)
	bookID := vars["id"]
	
	var activeRentals int
	err := db.QueryRow(`
		SELECT COUNT(*) FROM rentals 
		WHERE book_id = $1 AND status = 'active'
	`, bookID).Scan(&activeRentals)
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	if activeRentals > 0 {
		http.Error(w, "Cannot delete book with active rentals", http.StatusBadRequest)
		return
	}
	
	result, err := db.Exec("DELETE FROM books WHERE id = $1", bookID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Book deleted successfully",
	})
}

func main(){
	connStr := "postgres://library:library@localhost:5432/alvorada_library?sslmode=disable"

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}
	defer db.Close()

	if err = db.Ping(); err !=nil {
		log.Fatal("Error pinging database:", err)
	}
	
	log.Println("✓ Connected to the database successfully ✓")

	r := mux.NewRouter()
	//Auth Routes
	r.HandleFunc("/api/auth/register", register).Methods("POST")
	r.HandleFunc("/api/auth/login", login).Methods("POST")
	r.HandleFunc("/api/auth/logout", logout).Methods("POST")
	r.HandleFunc("/api/auth/me", getCurrentUser).Methods("GET")
//Book Routes
	r.HandleFunc("/api/categories", getCategories).Methods("GET")
	r.HandleFunc("/api/books",getBooks).Methods("GET")
	r.HandleFunc("/api/books/search", searchBooks).Methods("GET")
	r.HandleFunc("/api/books/category/{category}", searchByCategory).Methods("GET")
	r.HandleFunc("/api/books/{id}", getBook).Methods("GET")
//Rental Routes
	r.HandleFunc("/api/rentals", rentBook).Methods("POST")
	r.HandleFunc("/api/rentals/my", getMyRentals).Methods("GET")
	r.HandleFunc("/api/rentals/{id}/return", returnBook).Methods("PUT")
//Admin Routes
	r.HandleFunc("/api/admin/books", requireAdmin(addBook)).Methods("POST")
	r.HandleFunc("/api/admin/books/{id}", requireAdmin(updateBook)).Methods("PUT")
	r.HandleFunc("/api/admin/books/{id}", requireAdmin(deleteBook)).Methods("DELETE")

c := cors.New(cors.Options{
	AllowedOrigins:   []string{"http://localhost:5173"},
	AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	AllowedHeaders:   []string{"Content-Type"},
	AllowCredentials: true,
})

	handler := c.Handler(r)

	fmt.Println("Server starting on port 8080...")
	http.ListenAndServe(":8080", handler)
}
