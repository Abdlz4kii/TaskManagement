package repositories

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
	"database/sql"
	"errors"
)

func GetAllUsers() ([]models.User, error) {
	rows, err := config.DB.Query(`
		SELECT id, name, email, role, is_active,
		       created_at, updated_at
		FROM users
		ORDER BY id DESC
	`)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User

	for rows.Next() {
		var user models.User

		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Role,
			&user.IsActive,
			&user.CreatedAt,
			&user.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		users = append(users, user)
	}

	return users, rows.Err()
}

func UpdateUserRole(userID uint, role string) error {
	_, err := config.DB.Exec(`
		UPDATE users
		SET role = ?, updated_at = NOW()
		WHERE id = ?
	`, role, userID)

	return err
}

func UpdateUserStatus(userID uint, isActive bool) error {
	_, err := config.DB.Exec(`
		UPDATE users
		SET is_active = ?, updated_at = NOW()
		WHERE id = ?
	`, isActive, userID)

	return err
}

func GetUserByID(userID uint) (models.User, error) {
	var user models.User

	err := config.DB.QueryRow(`
		SELECT id, name, email, role, is_active,
		       created_at, updated_at
		FROM users
		WHERE id = ?
	`, userID).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	return user, err
}

func UpdateAdminAccount(
	adminID uint,
	newRole string,
	newStatus bool,
) error {

	tx, err := config.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	rows, err := tx.Query(`
		SELECT id
		FROM users
		WHERE role = 'ADMIN' AND is_active = 1
		FOR UPDATE
	`)
	if err != nil {
		return err
	}

	var activeAdmins int

	for rows.Next() {
		var id uint
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		activeAdmins++
	}

	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()

	var currentRole string
	var currentStatus bool

	err = tx.QueryRow(`
		SELECT role, is_active
		FROM users
		WHERE id = ?
		FOR UPDATE
	`, adminID).Scan(&currentRole, &currentStatus)

	if err != nil {
		return err
	}

	willRemoveAdmin := currentRole == "ADMIN" &&
		currentStatus &&
		(newRole != "ADMIN" || !newStatus)

	if willRemoveAdmin && activeAdmins <= 1 {
		return errors.New("sistem harus memiliki minimal satu Admin aktif")
	}

	_, err = tx.Exec(`
		UPDATE users
		SET role = ?, is_active = ?, updated_at = NOW()
		WHERE id = ?
	`, newRole, newStatus, adminID)

	if err != nil {
		return err
	}

	return tx.Commit()
}

var _ = sql.ErrNoRows
