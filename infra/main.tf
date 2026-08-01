terraform {
  required_version = "= 1.11.6"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "= 5.22.0"
    }
  }

  backend "s3" {
    key                         = "production/ironmon-live.tfstate"
    region                      = "auto"
    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }
}

provider "cloudflare" {}

resource "cloudflare_workers_custom_domain" "live" {
  account_id = var.cloudflare_account_id
  hostname   = var.hostname
  service    = var.worker_name
  zone_id    = var.cloudflare_zone_id
}

resource "cloudflare_r2_bucket" "companion_releases" {
  account_id    = var.cloudflare_account_id
  name          = var.release_bucket_name
  location      = "weur"
  storage_class = "Standard"
}

resource "cloudflare_r2_custom_domain" "companion_releases" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.companion_releases.name
  domain      = var.download_hostname
  zone_id     = var.cloudflare_zone_id
  enabled     = true
  min_tls     = "1.2"
}
