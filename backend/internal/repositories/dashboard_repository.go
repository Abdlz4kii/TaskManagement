package repositories

import (
	"TaskManagement/config"
	"TaskManagement/internal/models"
)

func GetAdminDashboard() (models.AdminDashboard, error) {
	var dashboard models.AdminDashboard

	err := config.DB.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM users),
			(SELECT COUNT(*) FROM users WHERE is_active = 1),
			(SELECT COUNT(*) FROM users WHERE is_active = 0),
			(SELECT COUNT(*) FROM tasks),
			(SELECT COUNT(*) FROM categories),
			(SELECT COUNT(*) FROM tasks WHERE status = 'TODO'),
			(SELECT COUNT(*) FROM tasks WHERE status = 'IN_PROGRESS'),
			(SELECT COUNT(*) FROM tasks WHERE status = 'DONE')
	`).Scan(
		&dashboard.TotalUsers,
		&dashboard.ActiveUsers,
		&dashboard.InactiveUsers,
		&dashboard.TotalTasks,
		&dashboard.TotalCategories,
		&dashboard.TasksTodo,
		&dashboard.TasksInProgress,
		&dashboard.TasksDone,
	)

	return dashboard, err
}

func GetUserDashboard(userID uint) (models.UserDashboard, error) {
	var dashboard models.UserDashboard

	err := config.DB.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM tasks WHERE user_id = ?),
			(SELECT COUNT(*) FROM categories WHERE user_id = ?),
			(SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'TODO'),
			(SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'IN_PROGRESS'),
			(SELECT COUNT(*) FROM tasks WHERE user_id = ? AND status = 'DONE')
	`, userID, userID, userID, userID, userID).Scan(
		&dashboard.TotalTasks,
		&dashboard.TotalCategories,
		&dashboard.TasksTodo,
		&dashboard.TasksInProgress,
		&dashboard.TasksDone,
	)

	return dashboard, err
}
