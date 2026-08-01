output "live_url" {
  description = "Public URL of the live companion."
  value       = "https://${var.hostname}"
}

output "companion_release_bucket" {
  description = "R2 bucket containing companion release artifacts."
  value       = cloudflare_r2_bucket.companion_releases.name
}

output "companion_download_hostname" {
  description = "Public custom domain for companion downloads."
  value       = cloudflare_r2_custom_domain.companion_releases.domain
}
