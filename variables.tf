variable "cloud_id" {
  type        = string
}

variable "folder_id" {
  type        = string
}

variable "zone" {
  type        = string
  default     = "ru-central1-a"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
}

variable "ydb_endpoint" {
  type        = string
}

variable "ydb_region" {
  type        = string
}

variable "cors_origins" {
  type        = string
  default     = "*"
}
