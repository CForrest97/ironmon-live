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

variable "release_bucket_name" {
  description = "R2 bucket containing immutable companion release artifacts."
  type        = string
  default     = "ironmon-live-releases"
}

variable "download_hostname" {
  description = "Production custom domain serving companion releases from R2."
  type        = string
  default     = "downloads.live.craigforrest.co.uk"
}
