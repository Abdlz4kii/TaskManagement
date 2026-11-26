package routes

import (
	"TaskManagement/internal/handlers"
	"TaskManagement/internal/middleware"

	"github.com/gin-gonic/gin"
)

func DashboardRoutes(router *gin.Engine) {
	user := router.Group("/dashboard")

	user.Use(middleware.AuthMiddleware())
	user.Use(middleware.RequireRole("USER"))

	user.GET("", handlers.GetUserDashboard)
}
