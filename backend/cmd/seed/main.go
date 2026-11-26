
package main

import (
	"TaskManagement/config"
	"database/sql"
	"fmt"
	"log"
	"os"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("File .env tidak ditemukan, menggunakan environment variables")
	}

	name := os.Getenv("ADMIN_NAME")
	email := os.Getenv("ADMIN_EMAIL")
	password := os.Getenv("ADMIN_PASSWORD")

	if name == "" || email == "" || password == "" {
		log.Fatal("ADMIN_NAME, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diisi")
	}

	config.ConnectDatabase()
	defer config.DB.Close()

	var existingID int

	err = config.DB.QueryRow(
		"SELECT id FROM users WHERE email = ?",
		email,
	).Scan(&existingID)

	if err == nil {
		log.Println("Email Admin sudah terdaftar. Seeder dibatalkan.")
		return
	}

	if err != sql.ErrNoRows {
		log.Fatal("Gagal memeriksa user:", err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Fatal("Gagal melakukan hash password:", err)
	}

	_, err = config.DB.Exec(`
		INSERT INTO users
		(name, email, password, role, is_active, created_at, updated_at)
		VALUES (?, ?, ?, 'ADMIN', 1, NOW(), NOW())
	`,
		name,
		email,
		string(hashedPassword),
	)

	if err != nil {
		log.Fatal("Gagal membuat Admin:", err)
	}

	fmt.Println("================================")
	fmt.Println("ADMIN BERHASIL DIBUAT!")
	fmt.Println("Nama  :", name)
	fmt.Println("Email :", email)
	fmt.Println("Role  : ADMIN")
	fmt.Println("Status: Aktif")
	fmt.Println("================================")
}
