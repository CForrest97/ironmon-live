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
