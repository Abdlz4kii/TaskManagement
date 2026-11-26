package handlers

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/services"
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
)

func GetAllAdminTasks(c *gin.Context) {
	page := 1
	limit := 10

	if value := c.Query("page"); value != "" {
		parsed, err := strconv.Atoi(value)

		if err != nil || parsed < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Page harus berupa angka minimal 1",
			})
			return
		}

		page = parsed
	}

	if value := c.Query("limit"); value != "" {
		parsed, err := strconv.Atoi(value)

		if err != nil || parsed < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Limit harus berupa angka minimal 1",
			})
			return
		}

		limit = parsed
	}

	if limit > 100 {
		limit = 100
	}

	filter := models.AdminTaskFilter{
		Page:  page,
		Limit: limit,
	}

	if value := c.Query("user_id"); value != "" {
		id, err := strconv.ParseUint(value, 10, 64)

		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "User ID tidak valid",
			})
			return
		}

		userID := uint(id)
		filter.UserID = &userID
	}

	tasks, total, err := services.GetAllAdminTasks(filter)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil seluruh task",
			"error":   err.Error(),
		})
		return
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, gin.H{
		"message": "Berhasil mengambil seluruh task",
		"data":    tasks,
		"pagination": models.TaskPagination{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	})
}
