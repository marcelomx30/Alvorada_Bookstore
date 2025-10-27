package main 

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"os"
)

func main(){
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run hash_password.go <password>")
		return
	}

	password := os.Args[1]
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Password hash:")
	fmt.Println(string(hash))
}
