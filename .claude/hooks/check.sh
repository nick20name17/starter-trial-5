#!/usr/bin/env bash
set -uo pipefail

input=$(cat)
field() { jq -r ".$1 // empty" <<<"$input"; }

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

cache_dir=node_modules/.cache
session=$(field session_id | tr -cd 'A-Za-z0-9-')
baseline_file="$cache_dir/claude-baseline-${session:-default}"
failed_file="$cache_dir/claude-failed-${session:-default}"

tree_hash() {
  {
    git rev-parse HEAD
    git diff HEAD
    # Not git hash-object: it stops at the first symlinked dir
    git ls-files -z --others --exclude-standard | xargs -0 -r shasum -- 2>/dev/null
  } | shasum | cut -d' ' -f1
}

if [ "$(field hook_event_name)" = "UserPromptSubmit" ]; then
  mkdir -p "$cache_dir"
  tree_hash >"$baseline_file"
  find "$cache_dir" -name 'claude-*' -mtime +7 -delete 2>/dev/null
  exit 0
fi

# Skip a tree unchanged since the prompt or last run, so Claude can stop after reporting a failure
current=$(tree_hash)
for file in "$baseline_file" "$failed_file"; do
  if [ -f "$file" ] && [ "$(cat "$file")" = "$current" ]; then
    exit 0
  fi
done

mkdir -p "$cache_dir"
if output=$(export NO_COLOR=1 FORCE_COLOR=0; bun run format 2>&1 >/dev/null && bun run check 2>&1); then
  # A turn can start without a prompt (a background task finished), leaving the baseline stale
  tree_hash >"$baseline_file"
  exit 0
fi

tree_hash >"$failed_file"

{
  echo "bun run check failed. Fix the errors your changes caused."
  echo "If an error is in code you did not touch, do not fix it: tell the user about it."
  echo
  echo "$output" | tail -n 100
} >&2
# Only exit 2 sends stderr to Claude, other codes just show it to the user
exit 2
