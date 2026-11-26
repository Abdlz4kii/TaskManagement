package services

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/repositories"
)

func CreateCategory(category models.Category) (models.Category, error) {
	return repositories.CreateCategory(category)
}

func GetAllCategories(userID uint) ([]models.Category, error) {
	return repositories.GetAllCategories(userID)
}

func GetCategoryByID(id uint, userID uint) (models.Category, error) {
	return repositories.GetCategoryByID(id, userID)
}

func UpdateCategory(id uint, userID uint, category models.Category) (models.Category, error) {
	return repositories.UpdateCategory(id, userID, category)
}

func DeleteCategory(id uint, userID uint) (bool, error) {
	return repositories.DeleteCategory(id, userID)
}
