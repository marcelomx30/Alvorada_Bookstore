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
)

var db *sql.DB

type BookResponse struct{
	Message string 	`json:"message"`
	Total int `json:"total"`
}


type Book struct{
	ID int `json:"id"`
	Nome string `json:"nome"`
	Categoria string `json:"categoria"`
	Autor string `json:"autor"`
	NumeroCopias int `json:"numero_copias"`

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


func getBooks(w http.ResponseWriter, req *http.Request){
	w.Header().Set("Content-Type", "application/json")
	query := "SELECT id, nome, categoria, numero_copias, autor FROM books ORDER BY nome"
	rows, err := db.Query(query)

	if err != nil{
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	books := []Book{}
	for rows.Next(){
		var book Book
		err := rows.Scan(&book.ID, &book.Nome, &book.Categoria, &book.NumeroCopias, &book.Autor)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		books = append(books,book)
	}

	json.NewEncoder(w).Encode(books)
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
	r.HandleFunc("/api/books/{id}", getBook).Methods("GET")

	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"http:localhost:5173"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	}).Handler(r)

	fmt.Println("Server starting on port 8080...")
	http.ListenAndServe(":8080", handler)
}
