package main

import (
	"TaskManagement/config"
	"TaskManagement/internal/middleware"
	"TaskManagement/routes"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func loadEnv() {
	currentDir, err := os.Getwd()
	if err != nil {
		log.Fatal("Gagal mendapatkan working directory:", err)
	}

	paths := []string{
		filepath.Join(currentDir, ".env"),
		filepath.Join(currentDir, "..", ".env"),
		filepath.Join(currentDir, "..", "..", ".env"),
	}

	for _, path := range paths {
		absolutePath, err := filepath.Abs(path)
		if err != nil {
			continue
		}

		if _, err := os.Stat(absolutePath); err == nil {
			if err := godotenv.Load(absolutePath); err != nil {
				log.Fatal("Gagal membaca .env:", err)
			}

			log.Println(".env berhasil dimuat:", absolutePath)
			return
		}
	}

	log.Fatal("File .env tidak ditemukan")
}

func main() {
	loadEnv()

	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET kosong, periksa file .env")
	}
	log.Println("JWT_SECRET berhasil dimuat")

	config.ConnectDatabase()

	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	router.LoadHTMLGlob("templates/*")

	router.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/login")
	})

	router.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", nil)
	})

	router.GET("/dashboard", func(c *gin.Context) {
		c.HTML(http.StatusOK, "dashboard.html", nil)
	})

	routes.AuthRoutes(router)
	routes.TaskRoutes(router)
	routes.CategoryRoutes(router)
	routes.AdminRoutes(router)
	routes.DashboardRoutes(router)

	log.Println("Server berjalan di http://localhost:8080/login")

	if err := router.Run(":8080"); err != nil {
		log.Fatal("Gagal menjalankan server:", err)
	}
}
