package routes

import (
	"TaskManagement/internal/handlers"
	"TaskManagement/internal/middleware"

	"github.com/gin-gonic/gin"
)

func AdminRoutes(router *gin.Engine) {
	admin := router.Group("/admin")

	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.RequireRole("ADMIN"))

	admin.GET("/users", handlers.GetAllUsers)
	admin.GET("/users/:id", handlers.GetUserByID)
	admin.PUT("/users/:id", handlers.UpdateUserAccount)
	admin.GET("/dashboard", handlers.GetAdminDashboard)
	admin.GET("/tasks", handlers.GetAllAdminTasks)
}
