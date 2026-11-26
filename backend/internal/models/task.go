package models

type Task struct {
	ID          uint   `json:"id"`
	UserID      uint   `json:"user_id"`
	CategoryID    *uint  `json:"category_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Priority    string `json:"priority"`
	DueDate     string `json:"due_date"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}