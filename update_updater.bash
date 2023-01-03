#!/bin/bash

set -e
#set -x

tmp_file="$(mktemp)"
gh release view --json assets,tagName,createdAt,name > "$tmp_file"

tmp_platforms="$(mktemp)"
jq '.platforms' tauri-update.json > "$tmp_platforms"

function update(){
  type=$1
  suffix=$2
  url="$(jq -r ".assets[] |select(.name |endswith(\"${suffix}\")) |.url" $tmp_file)"
  sig="$(curl -Lfs -H "Authentication: token $GITHUB_TOKEN" "${url}.sig")"
  newContent="$(jq ".[\"$type\"] = {\"signature\":\"$sig\", \"url\":\"$url\"}" "$tmp_platforms")"
  echo "$newContent" > "$tmp_platforms"
}
releaseName="$(jq -r '.name' "$tmp_file")"
releaseBody="$(jq -r '.body' "$tmp_file")"
releaseNotes="$(sed 's|\\n\\nnull$||' <<< "$releaseName\n\n$releaseBody")"
tagName="$(jq -r '.tagName' "$tmp_file")"
version="$(sed 's|^v||' <<< "$tagName")"
createdAt="$(jq -r '.createdAt' "$tmp_file")"

update "windows-x86_64" "_x64_en-US.msi.zip"
update "darwin-x86_64" ".app.tar.gz"
update "darwin-aarch64" ".app.tar.gz"
update "linux-x86_64" "_amd64.AppImage.tar.gz"

newContent="$(jq ".platforms = $(cat $tmp_platforms)" tauri-update.json)"
newContent="$(jq ".notes = \"$releaseNotes\"" <<< "$newContent")"
newContent="$(jq ".version = \"$version\"" <<< "$newContent")"
newContent="$(jq ".pub_date = \"$createdAt\"" <<< "$newContent")"
echo "$newContent" > tauri-update.json
