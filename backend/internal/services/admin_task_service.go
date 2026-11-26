package services

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/repositories"
)

func GetAllAdminTasks(filter models.AdminTaskFilter) ([]models.AdminTask, int, error) {
	return repositories.GetAllAdminTasks(filter)
}
