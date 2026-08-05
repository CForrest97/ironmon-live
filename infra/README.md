# Production infrastructure

OpenTofu owns the production Worker custom domain and independently managed
Cloudflare resources. Wrangler owns the Worker bundle, static assets, Durable
Object migration, bindings, and runtime variables because those must change
atomically with application code. A resource must never be declared in both
places.

## Bootstrap remote state

The state bucket is the sole manual infrastructure prerequisite because an
OpenTofu root cannot safely create its own backend:

1. Create a private R2 bucket named for the repository, such as
   `ironmon-live-tofu-state`.
2. Create bucket-scoped R2 credentials with Object Read & Write access.
3. Copy `backend.hcl.example` to an ignored `backend.hcl` and replace its
   account identifier and bucket when necessary.
4. Export the credentials as `AWS_ACCESS_KEY_ID` and
   `AWS_SECRET_ACCESS_KEY`. Never add them to an HCL file.
5. Run `tofu -chdir=infra init -backend-config=backend.hcl`.

Cloudflare API authentication is supplied independently through
`CLOUDFLARE_API_TOKEN`. Production input values are supplied through `TF_VAR_`
environment variables or an ignored `.tfvars` file.

## Commands

```sh
tofu -chdir=infra fmt -check
tofu -chdir=infra validate
tofu -chdir=infra plan -out=production.tfplan
tofu -chdir=infra apply production.tfplan
```

CI serializes production jobs and uses the protected `prod` environment for
pull-request plans and applies infrastructure changes on `main`. Manual
infrastructure dispatch from `main` remains available for recovery from
workflow startup failures; dispatches from any other ref cannot apply. Every
push to `main` also runs the repository checks and deploys the application
through Wrangler; local build and tool working directories remain ignored
development artifacts.

## Companion releases

OpenTofu creates the `ironmon-live-releases` R2 bucket and connects
`downloads.live.craigforrest.co.uk` as its production custom domain. The managed `r2.dev`
development URL remains disabled. Release automation uploads immutable,
versioned companion artifacts through Wrangler using the same Cloudflare API
token as the application deployment. The private state backend continues to
use its separate S3-compatible credentials.

The bucket's CORS policy permits read requests from the official website origin
only. This lets the website read `companion/latest.json` while keeping the
release bucket as the artifact origin; direct download links do not require a
CORS exception. After changing this policy in production, purge the downloads
hostname cache so already-cached objects receive the new CORS headers.

The protected `prod` environment must provide the
`CLOUDFLARE_DEPLOY_API_TOKEN` secret with access to deploy the application and
write release objects, plus the `R2_RELEASE_BUCKET` and
`CLOUDFLARE_ACCOUNT_ID` variables. Companion builds additionally require the
Tauri updater private-key secrets and `TAURI_UPDATER_PUBLIC_KEY` variable
documented by the release workflow. These keys protect in-app updates without
an Apple Developer account and do not make the DMG Developer ID signed or
notarized. No key belongs in the repository.

Versioned release objects are immutable and retained indefinitely for v1;
operators must not overwrite or delete an existing version during routine
release work. Rollback means republishing `companion/latest.json` so it points
to a previously verified updater archive. The matching versioned DMGs,
signatures, checksums, and notes remain available throughout the rollback.
