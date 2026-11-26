package handlers

import (
	"TaskManagement/internal/services"
	"net/http"
	"github.com/gin-gonic/gin"
)

func GetAdminDashboard(c *gin.Context) {
	dashboard, err := services.GetAdminDashboard()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil dashboard Admin",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Dashboard Admin berhasil diambil",
		"data":    dashboard,
	})
}

func GetUserDashboard(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "User tidak terautentikasi",
		})
		return
	}

	userID, ok := userIDValue.(uint)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "User ID tidak valid",
		})
		return
	}

	dashboard, err := services.GetUserDashboard(userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil dashboard User",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Dashboard User berhasil diambil",
		"data":    dashboard,
	})
}
