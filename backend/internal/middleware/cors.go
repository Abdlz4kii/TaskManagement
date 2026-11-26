package middleware

import (
	"github.com/gin-gonic/gin"
)

var allowedOrigins = map[string]bool{
	"http://127.0.0.1:5500": true, 
	"http://localhost:5500": true,
	"http://127.0.0.1:5501": true,
	"http://localhost:5501": true,
	"http://127.0.0.1:3000": true,
	"http://localhost:3000": true,
	"http://127.0.0.1:8000": true,
	"http://localhost:8000": true,
	"null":                  true,
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		if allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
