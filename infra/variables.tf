variable "cloudflare_account_id" {
  description = "Cloudflare account containing the Worker."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone containing the live hostname."
  type        = string
}

variable "hostname" {
  description = "Production hostname routed to the Worker."
  type        = string
}

variable "worker_name" {
  description = "Wrangler-managed Worker service name."
  type        = string
  default     = "ironmon-live"
}
