package handlers

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/services"
	"database/sql"
	"strconv"
	"strings"
	"github.com/gin-gonic/gin"
)

func GetTasks(c *gin.Context) {
	userIDValue, exists := c.Get("user_id")

	if !exists {
		c.JSON(401, gin.H{
			"message": "User tidak terautentikasi",
		})
		return
	}

	userID, ok := userIDValue.(uint)

	if !ok {
		c.JSON(401, gin.H{
			"message": "User ID tidak valid",
		})
		return
	}

	page := 1
	limit := 10

	if value := c.Query("page"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 {
			c.JSON(400, gin.H{
				"message": "Page harus berupa angka minimal 1",
			})
			return
		}
		page = parsed
	}

	if value := c.Query("limit"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 {
			c.JSON(400, gin.H{
				"message": "Limit harus berupa angka minimal 1",
			})
			return
		}
		limit = parsed
	}

	if limit > 100 {
		limit = 100
	}

	filter := models.TaskFilter{
		Search:    c.Query("search"),
		Status:    strings.ToUpper(c.Query("status")),
		Priority:  strings.ToUpper(c.Query("priority")),
		SortBy:    c.DefaultQuery("sort_by", "created_at"),
		SortOrder: c.DefaultQuery("sort_order", "DESC"),
		Page:      page,
		Limit:     limit,
	}

	if filter.Status != "" &&
		filter.Status != "TODO" &&
		filter.Status != "IN_PROGRESS" &&
		filter.Status != "DONE" {
		c.JSON(400, gin.H{
			"message": "Status tidak valid",
		})
		return
	}

	if filter.Priority != "" &&
		filter.Priority != "LOW" &&
		filter.Priority != "MEDIUM" &&
		filter.Priority != "HIGH" {
		c.JSON(400, gin.H{
			"message": "Priority tidak valid",
		})
		return
	}

	if value := c.Query("category_id"); value != "" {
		id, err := strconv.ParseUint(value, 10, 64)

		if err != nil || id == 0 {
			c.JSON(400, gin.H{
				"message": "Category ID tidak valid",
			})
			return
		}

		categoryID := uint(id)
		filter.CategoryID = &categoryID
	}

	tasks, total, err := services.GetAllTasks(userID, filter)

	if err != nil {
		c.JSON(500, gin.H{
			"message": "Gagal mengambil data task",
			"error":   err.Error(),
		})
		return
	}

	totalPages := (total + limit - 1) / limit

	c.JSON(200, gin.H{
		"message": "Berhasil mengambil daftar task",
		"data":    tasks,
		"pagination": models.TaskPagination{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	})
}

func CreateTask(c *gin.Context) {
	var task models.Task

	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(400, gin.H{
			"message": "Input tidak valid",
		})
		return
	}

	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{
			"message": "User tidak terautentikasi",
		})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(401, gin.H{
			"message": "User ID tidak valid",
		})
		return
	}

	task.UserID = userID

	if task.Title == "" {
		c.JSON(400, gin.H{
			"message": "Title wajib diisi",
		})
		return
	}

	result, err := services.CreateTask(task)

	if err != nil {
		if err == services.ErrInvalidCategory {
			c.JSON(400, gin.H{
				"message": "Kategori tidak valid atau bukan milik kamu",
			})
			return
		}

		c.JSON(500, gin.H{
			"message": "Gagal membuat task",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(201, gin.H{
		"message": "Task berhasil dibuat",
		"data":    result,
	})
}

func GetTaskByID(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{
			"message": "ID task tidak valid",
		})
		return
	}

	userIDValue, exists := c.Get("user_id")

	if !exists {
		c.JSON(401, gin.H{
			"message": "User tidak terautentikasi",
		})
		return
	}

	userID, ok := userIDValue.(uint)

	if !ok {
		c.JSON(401, gin.H{
			"message": "User ID tidak valid",
		})
		return
	}

	task, err := services.GetTaskByID(uint(id), userID)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{
				"message": "Task tidak ditemukan",
			})
			return
		}

		c.JSON(500, gin.H{
			"message": "Gagal mengambil task",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Task berhasil ditemukan",
		"data":    task,
	})
}

func UpdateTask(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{
			"message": "ID task tidak valid",
		})
		return
	}

	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(401, gin.H{
			"message": "User ID tidak valid",
		})
		return
	}

	var task models.Task

	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(400, gin.H{
			"message": "Format JSON tidak valid",
		})
		return
	}

	if task.Title == "" {
		c.JSON(400, gin.H{
			"message": "Title wajib diisi",
		})
		return
	}

	updatedTask, err := services.UpdateTask(uint(id), userID, task)

	if err != nil {
		if err == services.ErrInvalidCategory {
			c.JSON(400, gin.H{
				"message": "Kategori tidak valid atau bukan milik kamu",
			})
			return
		}

		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{
				"message": "Task tidak ditemukan",
			})
			return
		}

		c.JSON(500, gin.H{
			"message": "Gagal mengubah task",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Task berhasil diperbarui",
		"data":    updatedTask,
	})
}

func DeleteTask(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{
			"message": "ID task tidak valid",
		})
		return
	}

	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{
			"message": "Unauthorized",
		})
		return
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		c.JSON(401, gin.H{
			"message": "User ID tidak valid",
		})
		return
	}

	deleted, err := services.DeleteTask(uint(id), userID)

	if err != nil {
		c.JSON(500, gin.H{
			"message": "Gagal menghapus task",
			"error":   err.Error(),
		})
		return
	}

	if !deleted {
		c.JSON(404, gin.H{
			"message": "Task tidak ditemukan",
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Task berhasil dihapus",
	})
}
