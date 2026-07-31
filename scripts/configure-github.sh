#!/usr/bin/env bash

set -euo pipefail

repository_name="ironmon-live"
owner="${1:-}"

if [[ -z "${owner}" ]]; then
  echo "Usage: scripts/configure-github.sh GITHUB_OWNER" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is required: https://cli.github.com/" >&2
  exit 1
fi

gh auth status
repository="${owner}/${repository_name}"

if ! gh repo view "${repository}" >/dev/null 2>&1; then
  gh repo create "${repository}" \
    --public \
    --description "Product-first, agentic development of IronMON Live"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/${repository}.git"
fi

gh api \
  --method PATCH \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "repos/${repository}" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true >/dev/null

gh api \
  --method PUT \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "repos/${repository}/actions/permissions" \
  --input .github/actions-permissions.json

gh api \
  --method PUT \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "repos/${repository}/actions/permissions/selected-actions" \
  --input .github/selected-actions.json

gh api \
  --method PUT \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "repos/${repository}/actions/permissions/workflow" \
  --input .github/workflow-permissions.json

gh label create product \
  --repo "${repository}" \
  --color "1D76DB" \
  --description "Product discovery and specifications" \
  --force

gh label create repository \
  --repo "${repository}" \
  --color "5319E7" \
  --description "Agent, process, and repository improvements" \
  --force

successful_runs="0"
if gh workflow view quality.yml --repo "${repository}" >/dev/null 2>&1; then
  successful_runs="$(gh run list \
    --repo "${repository}" \
    --workflow quality.yml \
    --branch main \
    --status success \
    --limit 1 \
    --json databaseId \
    --jq 'length')"
fi

if [[ "${successful_runs}" == "0" ]]; then
  echo "Remote settings applied, but the main ruleset was not created." >&2
  echo "Push main, wait for Quality to pass, then run this script again." >&2
  exit 3
fi

ruleset_id="$(gh api \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "repos/${repository}/rulesets" \
  --jq '.[] | select(.name == "main") | .id' | head -n 1)"

if [[ -n "${ruleset_id}" ]]; then
  gh api \
    --method PUT \
    -H "X-GitHub-Api-Version: 2026-03-10" \
    "repos/${repository}/rulesets/${ruleset_id}" \
    --input .github/rulesets/main.json >/dev/null
else
  gh api \
    --method POST \
    -H "X-GitHub-Api-Version: 2026-03-10" \
    "repos/${repository}/rulesets" \
    --input .github/rulesets/main.json >/dev/null
fi

echo "Configured https://github.com/${repository}"
