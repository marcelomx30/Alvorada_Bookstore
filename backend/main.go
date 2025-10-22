package main

import(
	"fmt"
	"net/http"
	"encoding/json"
	"database/sql"
	_"github.com/lib/pq"
	"log"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"strconv"
)

var db *sql.DB

type BookResponse struct{
	Message string 	`json:"message"`
	Total int `json:"total"`
}

type CategoryCount struct{
	Name string `json:"name"`
	Quantity int `json:quantity`
}

type Book struct{
	ID int `json:"id"`
	Nome string `json:"nome"`
	Categoria string `json:"categoria"`
	Autor string `json:"autor"`
	NumeroCopias int `json:"numero_copias"`

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
		if l, err := strconv.Atoi(limitStr); err == nil && l>0 && l<= 100 {
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


func getBook(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")
	vars := mux.Vars(req)
	id := vars["id"]
	query := "SELECT id, nome, categoria, numero_copias, autor FROM books WHERE id = $1"
	var book Book
	err := db.QueryRow(query, id).Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor)

	if err == sql.ErrNoRows{
		http.Error(w, "Book NOT FOUND", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(book)
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
	query := "SELECT id, nome, categoria, numero_copias, autor FROM books ORDER BY nome LIMIT $1 OFFSET $2"
	rows, err := db.Query(query, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	books := []Book{}
	for rows.Next() {
		var book Book
		err := rows.Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor)
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
		query = "SELECT id, nome, categoria, numero_copias, autor FROM books WHERE autor ILIKE $1 ORDER BY nome LIMIT $2 OFFSET $3"
		countQuery = "SELECT COUNT(*) FROM books WHERE autor ILIKE $1"
		args = []interface{}{searchPattern, limit, offset}
		
	case "title":
		query = "SELECT id, nome, categoria, numero_copias, autor FROM books WHERE nome ILIKE $1 ORDER BY nome LIMIT $2 OFFSET $3"
		countQuery = "SELECT COUNT(*) FROM books WHERE nome ILIKE $1"
		args = []interface{}{searchPattern, limit, offset}
		
	default:
		query = "SELECT id, nome, categoria, numero_copias, autor FROM books WHERE nome ILIKE $1 OR autor ILIKE $1 ORDER BY nome LIMIT $2 OFFSET $3"
		countQuery = "SELECT COUNT(*) FROM books WHERE nome ILIKE $1 OR autor ILIKE $1"
		args = []interface{}{searchPattern, limit, offset}
	}
	
	// Get total count
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
		err := rows.Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor)
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
	r.HandleFunc("/api/books",getBooks).Methods("GET")
	r.HandleFunc("/api/books/search", searchBooks).Methods("GET")
	r.HandleFunc("/api/books/{id}", getBook).Methods("GET")


	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	fmt.Println("Server starting on port 8080...")
	http.ListenAndServe(":8080", handler)
}
