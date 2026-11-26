package middleware

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func RequireRole(allowedRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleValue, exists := c.Get("role")

		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Role tidak ditemukan",
			})
			c.Abort()
			return
		}

		role, ok := roleValue.(string)

		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Role tidak valid",
			})
			c.Abort()
			return
		}

		if role != allowedRole {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Kamu tidak memiliki akses",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
