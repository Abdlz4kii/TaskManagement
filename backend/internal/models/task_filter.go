package models

type TaskFilter struct {
	Search    string
	Status    string
	Priority  string
	CategoryID *uint
	SortBy    string
	SortOrder string
	Page      int
	Limit     int
}

type TaskPagination struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}
