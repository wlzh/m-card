#!/bin/sh
set -eu

extension_id=${1:-}
case "$extension_id" in
  '') printf 'Usage: pnpm install:photos-helper -- <32-character Chrome extension ID>\n' >&2; exit 2 ;;
  *[!a-p]*) printf 'Invalid Chrome extension ID: %s\n' "$extension_id" >&2; exit 2 ;;
esac
if [ "${#extension_id}" -ne 32 ]; then
  printf 'Chrome extension ID must be 32 characters\n' >&2
  exit 2
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
host_dir="$HOME/Library/Application Support/M.Card/photos-helper"
manifest_dir="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
host="$host_dir/m-card-photos-host"
manifest="$manifest_dir/com.mcard.photos.json"

if ! command -v swiftc >/dev/null 2>&1; then
  printf 'Swift compiler not found. Install Apple Command Line Tools with: xcode-select --install\n' >&2
  exit 1
fi

mkdir -p "$host_dir" "$manifest_dir"
swiftc -O "$project_dir/native/photos-helper/main.swift" -o "$host"
cp "$project_dir/native/photos-helper/PhotosImport.applescript" "$host_dir/PhotosImport.applescript"
chmod 700 "$host"
escaped_host=$(printf '%s' "$host" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"name":"com.mcard.photos","description":"M.Card Photos importer","path":"%s","type":"stdio","allowed_origins":["chrome-extension://%s/"]}\n' \
  "$escaped_host" "$extension_id" > "$manifest"
chmod 600 "$manifest"
printf 'Installed M.Card Photos helper for extension %s\n' "$extension_id"
printf 'Reload the extension at chrome://extensions and refresh open X tabs.\n'
