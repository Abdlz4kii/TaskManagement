package handlers

import (
	"TaskManagement/internal/services"
	"database/sql"
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
)

func GetAllUsers(c *gin.Context) {
	users, err := services.GetAllUsers()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil data user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Berhasil mengambil data user",
		"data":    users,
	})
}

func GetUserByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)

	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID user tidak valid",
		})
		return
	}

	user, err := services.GetUserByID(uint(id))

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"message": "User tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil data user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}

type UpdateUserRequest struct {
	Role     string `json:"role" binding:"required"`
	IsActive *bool  `json:"is_active" binding:"required"`
}

func UpdateUserAccount(c *gin.Context) {
	adminValue, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Admin tidak terautentikasi",
		})
		return
	}

	adminID, ok := adminValue.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "ID Admin tidak valid",
		})
		return
	}

	targetID, err := strconv.ParseUint(c.Param("id"), 10, 64)

	if err != nil || targetID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID user tidak valid",
		})
		return
	}

	var request UpdateUserRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Data role dan is_active wajib diisi",
		})
		return
	}

	err = services.UpdateUserAccount(
		adminID,
		uint(targetID),
		request.Role,
		*request.IsActive,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Akun user berhasil diperbarui",
	})
}
