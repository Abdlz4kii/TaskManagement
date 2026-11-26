package repositories

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
)

func CreateUser(user models.User) error {
	_, err := config.DB.Exec(`
		INSERT INTO users
		(name, email, password, role, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, NOW(), NOW())
	`,
		user.Name,
		user.Email,
		user.Password,
		user.Role,
		user.IsActive,
	)

	return err
}

func GetUserByEmail(email string) (models.User, error) {
	var user models.User

	err := config.DB.QueryRow(`
		SELECT id, name, email, password, role,
		       is_active, created_at, updated_at
		FROM users
		WHERE email = ?
	`, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	return user, err
}
