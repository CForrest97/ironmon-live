#!/usr/bin/env bash

set -euo pipefail

repository_name="ironmon-live"
owner="${1:-}"

if [[ -z "${owner}" ]]; then
  echo "Usage: npm run configure:github -- GITHUB_OWNER" >&2
  exit 2
fi

repository="${owner}/${repository_name}"
api_version=(-H "X-GitHub-Api-Version: 2026-03-10")

gh auth status

if ! gh repo view "${repository}" >/dev/null 2>&1; then
  gh repo create "${repository}" \
    --public \
    --description "Product-first, agentic development of IronMON Live"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/${repository}.git"
fi

gh api --method PATCH "${api_version[@]}" "repos/${repository}" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F has_issues=false \
  -F delete_branch_on_merge=true >/dev/null

gh api --method PUT "${api_version[@]}" "repos/${repository}/actions/permissions" \
  --input .github/actions-permissions.json >/dev/null
gh api --method PUT "${api_version[@]}" "repos/${repository}/actions/permissions/selected-actions" \
  --input .github/selected-actions.json >/dev/null
gh api --method PUT "${api_version[@]}" "repos/${repository}/actions/permissions/workflow" \
  --input .github/workflow-permissions.json >/dev/null

successful_runs=0
if gh workflow view quality.yml --repo "${repository}" >/dev/null 2>&1; then
  successful_runs="$(gh run list \
    --repo "${repository}" \
    --workflow quality.yml \
    --branch main \
    --status success \
    --limit 1 \
    --json databaseId \
    --jq length)"
fi

if [[ "${successful_runs}" -eq 0 ]]; then
  echo "Remote settings applied, but the main ruleset was not created." >&2
  echo "Push main, wait for Quality to pass, then run this command again." >&2
  exit 3
fi

ruleset_id="$(gh api "${api_version[@]}" "repos/${repository}/rulesets" \
  --jq '.[] | select(.name == "main") | .id' | head -n 1)"

if [[ -n "${ruleset_id}" ]]; then
  gh api --method PUT "${api_version[@]}" "repos/${repository}/rulesets/${ruleset_id}" \
    --input .github/rulesets/main.json >/dev/null
else
  gh api --method POST "${api_version[@]}" "repos/${repository}/rulesets" \
    --input .github/rulesets/main.json >/dev/null
fi

echo "Configured https://github.com/${repository}"
