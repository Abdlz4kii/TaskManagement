package routes

import (
	"github.com/gin-gonic/gin"
	"TaskManagement/internal/handlers"
)

func AuthRoutes(router *gin.Engine) {
	router.POST("/register", handlers.Register)
	router.POST("/login", handlers.Login)
}