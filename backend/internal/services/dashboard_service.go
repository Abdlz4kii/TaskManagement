package services

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/repositories"
)

func GetAdminDashboard() (models.AdminDashboard, error) {
	return repositories.GetAdminDashboard()
}

func GetUserDashboard(userID uint) (models.UserDashboard, error) {
	return repositories.GetUserDashboard(userID)
}
