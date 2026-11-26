package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"TaskManagement/internal/models"
	"TaskManagement/internal/services"
	"github.com/gin-gonic/gin"
)

func getCategoryUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "User tidak ditemukan",
		})
		return 0, false
	}

	id, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "User ID tidak valid",
		})
		return 0, false
	}

	return id, true
}

func CreateCategory(c *gin.Context) {
	userID, ok := getCategoryUserID(c)
	if !ok {
		return
	}

	var category models.Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Format JSON tidak valid",
		})
		return
	}

	if category.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Nama kategori wajib diisi",
		})
		return
	}

	category.UserID = userID

	result, err := services.CreateCategory(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal membuat kategori",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kategori berhasil dibuat",
		"data":    result,
	})
}

func GetCategories(c *gin.Context) {
	userID, ok := getCategoryUserID(c)
	if !ok {
		return
	}

	categories, err := services.GetAllCategories(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil kategori",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
	})
}

func GetCategoryByID(c *gin.Context) {
	userID, ok := getCategoryUserID(c)
	if !ok {
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID kategori tidak valid",
		})
		return
	}

	category, err := services.GetCategoryByID(uint(id), userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Kategori tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil kategori",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": category,
	})
}

func UpdateCategory(c *gin.Context) {
	userID, ok := getCategoryUserID(c)
	if !ok {
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID kategori tidak valid",
		})
		return
	}

	var category models.Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Format JSON tidak valid",
		})
		return
	}

	if category.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Nama kategori wajib diisi",
		})
		return
	}

	result, err := services.UpdateCategory(uint(id), userID, category)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "Kategori tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal memperbarui kategori",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kategori berhasil diperbarui",
		"data":    result,
	})
}

func DeleteCategory(c *gin.Context) {
	userID, ok := getCategoryUserID(c)
	if !ok {
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID kategori tidak valid",
		})
		return
	}

	deleted, err := services.DeleteCategory(uint(id), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal menghapus kategori",
		})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Kategori tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kategori berhasil dihapus",
	})
}
