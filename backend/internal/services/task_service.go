package services

import (
	"TaskManagement/internal/models"
	"TaskManagement/internal/repositories"
	"database/sql"
	"errors"
)

var ErrInvalidCategory = errors.New("kategori tidak valid")

func validateTaskCategory(task models.Task) error {
	if task.CategoryID == nil {
		return nil
	}

	_, err := repositories.GetCategoryByID(
		*task.CategoryID,
		task.UserID,
	)

	if errors.Is(err, sql.ErrNoRows) {
		return ErrInvalidCategory
	}

	return err
}


func GetAllTasks(userID uint, filter models.TaskFilter) ([]models.Task, int, error) {
	return repositories.GetAllTasks(userID, filter)
}

func GetTaskByID(id uint, userID uint) (models.Task, error) {
	return repositories.GetTaskByID(id, userID)
}

func CreateTask(task models.Task) (models.Task, error) {
	if err := validateTaskCategory(task); err != nil {
		return task, err
	}

	return repositories.CreateTask(task)
}

func UpdateTask(id uint, userID uint, task models.Task) (models.Task, error) {
	task.UserID = userID

	if err := validateTaskCategory(task); err != nil {
		return task, err
	}

	return repositories.UpdateTask(id, userID, task)
}

func DeleteTask(id uint, userID uint) (bool, error) {
	return repositories.DeleteTask(id, userID)
}