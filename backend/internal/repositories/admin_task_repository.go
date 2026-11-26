package repositories

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
	"database/sql"
)

func GetAllAdminTasks(filter models.AdminTaskFilter) ([]models.AdminTask, int, error) {
	where := ""
	args := []interface{}{}

	if filter.UserID != nil {
		where = " WHERE t.user_id = ?"
		args = append(args, *filter.UserID)
	}

	var total int

	countQuery := `
		SELECT COUNT(*)
		FROM tasks t
		JOIN users u ON u.id = t.user_id
	` + where

	err := config.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit

	query := `
		SELECT
			t.id,
			t.user_id,
			u.name,
			t.category_id,
			t.title,
			t.description,
			t.priority,
			t.status,
			COALESCE(DATE_FORMAT(t.due_date, '%Y-%m-%d'), ''),
			t.created_at,
			t.updated_at
		FROM tasks t
		JOIN users u ON u.id = t.user_id
	` + where + `
		ORDER BY t.created_at DESC
		LIMIT ? OFFSET ?
	`

	queryArgs := append(args, filter.Limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	tasks := []models.AdminTask{}

	for rows.Next() {
		var task models.AdminTask
		var categoryID sql.NullInt64

		err := rows.Scan(
			&task.ID,
			&task.UserID,
			&task.OwnerName,
			&categoryID,
			&task.Title,
			&task.Description,
			&task.Priority,
			&task.Status,
			&task.DueDate,
			&task.CreatedAt,
			&task.UpdatedAt,
		)

		if err != nil {
			return nil, 0, err
		}

		if categoryID.Valid {
			id := uint(categoryID.Int64)
			task.CategoryID = &id
		}

		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}
