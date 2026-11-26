package models

type AdminTask struct {
	ID          uint   `json:"id"`
	UserID      uint   `json:"user_id"`
	OwnerName   string `json:"owner_name"`
	CategoryID  *uint  `json:"category_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
	Status      string `json:"status"`
	DueDate     string `json:"due_date"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type AdminTaskFilter struct {
	UserID *uint
	Page   int
	Limit  int
}
