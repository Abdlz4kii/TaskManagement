package handlers

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
	"TaskManagement/internal/repositories"
	"log"
	"net/http"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Input tidak valid",
		})
		return
	}

	if user.Name == "" || user.Email == "" || user.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Name, email, dan password wajib diisi",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(user.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengamankan password",
		})
		return
	}

	user.Password = string(hashedPassword)

	user.Role = "USER"
	user.IsActive = true

	err = repositories.CreateUser(user)

	if err != nil {
		log.Println("ERROR REGISTER:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal membuat akun",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Register berhasil",
		"data": gin.H{
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func Login(c *gin.Context) {
	var input models.User

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Input tidak valid",
		})
		return
	}

	if input.Email == "" || input.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Email dan password wajib diisi",
		})
		return
	}

	user, err := repositories.GetUserByEmail(input.Email)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Email atau password salah",
		})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"message": "Akun tidak aktif",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.Password),
		[]byte(input.Password),
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Email atau password salah",
		})
		return
	}

	token, err := config.GenerateJWT(user.ID, user.Role)

	if err != nil {
		log.Println("ERROR GENERATE JWT:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal membuat token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil",
		"token":   token,
		"data": gin.H{
			"id":        user.ID,
			"name":      user.Name,
			"email":     user.Email,
			"role":      user.Role,
			"is_active": user.IsActive,
		},
	})
}
