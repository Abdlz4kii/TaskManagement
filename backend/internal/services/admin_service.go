package services

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/repositories"
	"errors"
)

func GetAllUsers() ([]models.User, error) {
	return repositories.GetAllUsers()
}

func GetUserByID(id uint) (models.User, error) {
	return repositories.GetUserByID(id)
}

func UpdateUserAccount(
	adminID uint,
	targetID uint,
	role string,
	isActive bool,
) error {

	if adminID == targetID {
		return errors.New("Admin tidak boleh mengubah akun sendiri")
	}

	if role != "USER" && role != "ADMIN" {
		return errors.New("Role hanya boleh USER atau ADMIN")
	}

	return repositories.UpdateAdminAccount(
		targetID,
		role,
		isActive,
	)
}
