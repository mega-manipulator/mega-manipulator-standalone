#!/bin/bash

set -e
#set -x

tmp_file="$(mktemp)"
gh release view --json assets,tagName,createdAt,name,body > "$tmp_file"

tmp_platforms="$(mktemp)"
jq '.platforms' tauri-update.json > "$tmp_platforms"

function update(){
  type=$1
  suffix=$2
  url="$(jq -r ".assets[] |select(.name |endswith(\"${suffix}\")) |.url" $tmp_file || printf '')"
  sig="$(curl -Lfs -H "Authentication: token $GITHUB_TOKEN" "${url}.sig" || printf '')"
  if [ "$url" == '' ] ; then
    echo "Missing url for $type" >&2
    return
  fi
  if [ "$sig" == '' ] ; then
    echo "Missing sig for $type" >&2
    return
  fi
  newContent="$(jq ".[\"$type\"] = {\"signature\":\"$sig\", \"url\":\"$url\"}" "$tmp_platforms")"
  echo "$newContent" > "$tmp_platforms"
}
releaseName="$(jq -r '.name' "$tmp_file")"
releaseBody="$(jq -r '.body' "$tmp_file" | sed '/Take a look at the assets to download and install this app./Q' | sed 's|\r$||g')"
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
