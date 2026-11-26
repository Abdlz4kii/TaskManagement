package repositories

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
	"database/sql"
)

func CreateCategory(category models.Category) (models.Category, error) {
	query := `INSERT INTO categories (user_id, name) VALUES (?, ?)`

	result, err := config.DB.Exec(query, category.UserID, category.Name)
	if err != nil {
		return category, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return category, err
	}

	category.ID = uint(id)

	return category, nil
}

func GetAllCategories(userID uint) ([]models.Category, error) {
	query := `SELECT id, user_id, name FROM categories WHERE user_id = ? ORDER BY id DESC`

	rows, err := config.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Category

	for rows.Next() {
		var category models.Category

		err := rows.Scan(
			&category.ID,
			&category.UserID,
			&category.Name,
		)
		if err != nil {
			return nil, err
		}

		categories = append(categories, category)
	}

	return categories, rows.Err()
}

func GetCategoryByID(id uint, userID uint) (models.Category, error) {
	query := `SELECT id, user_id, name FROM categories WHERE id = ? AND user_id = ?`

	var category models.Category

	err := config.DB.QueryRow(query, id, userID).Scan(
		&category.ID,
		&category.UserID,
		&category.Name,
	)

	return category, err
}

func UpdateCategory(id uint, userID uint, category models.Category) (models.Category, error) {
	query := `UPDATE categories SET name = ? WHERE id = ? AND user_id = ?`

	result, err := config.DB.Exec(query, category.Name, id, userID)
	if err != nil {
		return category, err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return category, err
	}

	if affected == 0 {
		_, err = GetCategoryByID(id, userID)
		if err != nil {
			return category, err
		}
	}

	return GetCategoryByID(id, userID)
}

func DeleteCategory(id uint, userID uint) (bool, error) {
	query := `DELETE FROM categories WHERE id = ? AND user_id = ?`

	result, err := config.DB.Exec(query, id, userID)
	if err != nil {
		return false, err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return affected > 0, nil
}

var _ = sql.ErrNoRows
