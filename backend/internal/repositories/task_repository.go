package repositories

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
	"database/sql"
	"fmt"
	"strings"
)


func GetAllTasks(userID uint, filter models.TaskFilter) ([]models.Task, int, error) {
	where := " WHERE user_id = ?"
	args := []interface{}{userID}

	if filter.Search != "" {
		where += " AND title LIKE ?"
		args = append(args, "%"+filter.Search+"%")
	}

	if filter.Status != "" {
		where += " AND status = ?"
		args = append(args, filter.Status)
	}

	if filter.Priority != "" {
		where += " AND priority = ?"
		args = append(args, filter.Priority)
	}

	if filter.CategoryID != nil {
		where += " AND category_id = ?"
		args = append(args, *filter.CategoryID)
	}

	var total int

	countQuery := "SELECT COUNT(*) FROM tasks" + where

	err := config.DB.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	sortColumns := map[string]string{
		"title":      "title",
		"created_at": "created_at",
		"due_date":   "due_date",
	}

	sortColumn, exists := sortColumns[filter.SortBy]
	if !exists {
		sortColumn = "created_at"
	}

	sortOrder := strings.ToUpper(filter.SortOrder)
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}

	offset := (filter.Page - 1) * filter.Limit

	query := fmt.Sprintf(`
		SELECT
			id,
			user_id,
			category_id,
			title,
			description,
			priority,
			status,
			COALESCE(DATE_FORMAT(due_date, '%%Y-%%m-%%d'), ''),
			created_at,
			updated_at
		FROM tasks
		%s
		ORDER BY %s %s
		LIMIT ? OFFSET ?
	`, where, sortColumn, sortOrder)

	queryArgs := append(args, filter.Limit, offset)

	rows, err := config.DB.Query(query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	tasks := []models.Task{}

	for rows.Next() {
		var task models.Task
		var categoryID sql.NullInt64

		err := rows.Scan(
			&task.ID,
			&task.UserID,
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


func GetTaskByID(id uint, userID uint) (models.Task, error) {
	var task models.Task

	query := `
		SELECT 
			id,
			user_id,
			category_id,
			title,
			description,
			priority,
			status,
			COALESCE(DATE_FORMAT(due_date, '%Y-%m-%d'), ''),
			created_at,
			updated_at
		FROM tasks
		WHERE id = ? AND user_id = ?
	`

	var categoryID sql.NullInt64

	err := config.DB.QueryRow(query, id, userID).Scan(
		&task.ID,
		&task.UserID,
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
		return task, err
	}

	if categoryID.Valid {
		categoryIDValue := uint(categoryID.Int64)
		task.CategoryID = &categoryIDValue
	}

	return task, nil
}

func CreateTask(task models.Task) (models.Task, error) {
	query := `
		INSERT INTO tasks (
			user_id,
			category_id,
			title,
			description,
			priority,
			status,
			due_date,
			created_at,
			updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
	`

	var dueDate interface{}

	if task.DueDate != "" {
		dueDate = task.DueDate
	}

	result, err := config.DB.Exec(
		query,
		task.UserID,
		task.CategoryID,
		task.Title,
		task.Description,
		task.Priority,
		task.Status,
		dueDate,
	)

	if err != nil {
		return task, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return task, err
	}

	task.ID = uint(id)

	return task, nil
}

func UpdateTask(id uint, userID uint, task models.Task) (models.Task, error) {
	query := `
		UPDATE tasks
		SET
			category_id = ?,
			title = ?,
			description = ?,
			priority = ?,
			status = ?,
			due_date = ?,
			updated_at = NOW()
		WHERE id = ? AND user_id = ?
	`

	var dueDate interface{}

	if task.DueDate != "" {
		dueDate = task.DueDate
	}

	_, err := config.DB.Exec(
		query,
		task.CategoryID,
		task.Title,
		task.Description,
		task.Priority,
		task.Status,
		dueDate,
		id,
		userID,
	)

	if err != nil {
		return task, err
	}

	updatedTask, err := GetTaskByID(id, userID)
	if err != nil {
		return task, err
	}

	return updatedTask, nil
}

func DeleteTask(id uint, userID uint) (bool, error) {
	query := `DELETE FROM tasks WHERE id = ? AND user_id = ?`

	result, err := config.DB.Exec(query, id, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}