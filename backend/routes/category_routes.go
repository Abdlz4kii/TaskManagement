package routes

import (
	"TaskManagement/internal/handlers"
	"TaskManagement/internal/middleware"
	"github.com/gin-gonic/gin"
)

func CategoryRoutes(router *gin.Engine) {
	category := router.Group("/categories")

	category.Use(middleware.AuthMiddleware())
	category.Use(middleware.RequireRole("USER"))

	category.POST("", handlers.CreateCategory)
	category.GET("", handlers.GetCategories)
	category.GET("/:id", handlers.GetCategoryByID)
	category.PUT("/:id", handlers.UpdateCategory)
	category.DELETE("/:id", handlers.DeleteCategory)
}
