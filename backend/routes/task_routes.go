package routes

import (
	"TaskManagement/internal/handlers"
	"TaskManagement/internal/middleware"
	"github.com/gin-gonic/gin"
)

func TaskRoutes(router *gin.Engine) {
	task := router.Group("/tasks")

	task.Use(middleware.AuthMiddleware())
	task.Use(middleware.RequireRole("USER"))

	task.POST("", handlers.CreateTask)
	task.GET("", handlers.GetTasks)
	task.GET("/:id", handlers.GetTaskByID)
	task.PUT("/:id", handlers.UpdateTask)
	task.DELETE("/:id", handlers.DeleteTask)
}
