package models

type AdminDashboard struct {
	TotalUsers      int `json:"total_users"`
	ActiveUsers     int `json:"active_users"`
	InactiveUsers   int `json:"inactive_users"`
	TotalTasks      int `json:"total_tasks"`
	TotalCategories int `json:"total_categories"`
	TasksTodo       int `json:"tasks_todo"`
	TasksInProgress int `json:"tasks_in_progress"`
	TasksDone       int `json:"tasks_done"`
}

type UserDashboard struct {
	TotalTasks      int `json:"total_tasks"`
	TotalCategories int `json:"total_categories"`
	TasksTodo       int `json:"tasks_todo"`
	TasksInProgress int `json:"tasks_in_progress"`
	TasksDone       int `json:"tasks_done"`
}
