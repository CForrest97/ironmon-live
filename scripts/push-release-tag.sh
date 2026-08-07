#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: npm run release:tag -- VERSION" >&2
  echo "Example: npm run release:tag -- 0.1.19" >&2
}

if [[ "$#" -ne 1 ]]; then
  usage
  exit 2
fi

release_version="$1"

if [[ ! "${release_version}" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "VERSION must be a semantic version such as 0.1.19 or v0.1.19." >&2
  exit 2
fi

tag="v${release_version#v}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This command must run inside a Git working tree." >&2
  exit 2
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "The Git remote 'origin' is required to publish ${tag}." >&2
  exit 2
fi

if git rev-parse --verify --quiet "refs/tags/${tag}" >/dev/null; then
  echo "The local tag ${tag} already exists." >&2
  exit 1
fi

if [[ -n "$(git ls-remote --tags origin "refs/tags/${tag}")" ]]; then
  echo "The remote tag ${tag} already exists on origin." >&2
  exit 1
fi

git tag "${tag}"
git push origin "refs/tags/${tag}"

echo "Pushed ${tag}; the companion release workflow has been triggered."
