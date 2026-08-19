#!/bin/bash
# 수집한 시드 이미지 정리: HEIC→JPG 변환, 중복 제거, 해상도 점검.
# 여러 번 돌려도 안전하다. macOS 기본 sips/bash 3.2만 쓴다.
set -euo pipefail
cd "$(dirname "$0")/../data/seed-images"

find . -name '.DS_Store' -delete

# HEIC → JPG. 원본은 변환 성공을 확인한 뒤에만 지운다.
while IFS= read -r -d '' f; do
  out="${f%.*}"; out="${out%.}.jpg"          # 'foo_n..heic' 같은 이중 점도 정리
  if sips -s format jpeg -s formatOptions 90 "$f" --out "$out" >/dev/null 2>&1 && [ -s "$out" ]; then
    rm "$f"; echo "변환  $(basename "$f")"
  else
    echo "실패  $(basename "$f")  ← 손대지 않음" >&2
  fi
done < <(find . -type f \( -iname '*.heic' -o -iname '*.heif' \) -print0)

# 중복 제거: 파일명 앞 숫자가 인스타 미디어 ID다. 같은 ID면 큰 파일만 남긴다.
# ponytail: 인스타 파일명에 공백이 없다는 전제. 공백 생기면 여기부터 깨진다.
for shop in */; do
  find "$shop" -type f -iname '*.jp*g' -exec stat -f '%z %N' {} + 2>/dev/null \
    | awk '{n=$2; sub(/.*\//,"",n); split(n,a,"_"); print a[1], $1, $2}' \
    | sort -k1,1 -k2,2nr \
    | awk '{if ($1==prev) print $3; prev=$1}' \
    | while read -r dup; do rm "$dup"; echo "중복  $(basename "$dup")"; done
done

echo
printf '%-24s %5s %7s  %s\n' 샵 장수 최소폭 비고
for shop in */; do
  n=0; min=99999
  for f in "$shop"*.jpg "$shop"*.jpeg; do
    [ -e "$f" ] || continue
    w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
    n=$((n+1)); [ "${w:-0}" -lt "$min" ] && min=$w
  done
  [ "$n" -eq 0 ] && { printf '%-24s %5s %7s  %s\n' "${shop%/}" 0 - "비어있음"; continue; }
  note=""
  [ "$min" -lt 1000 ] && note="⚠ 그리드 썸네일 섞임 — 게시물 열어서 다시 받을 것"
  [ "$n" -lt 25 ] && note="$note${note:+ / }25장까지 $((25-n))장 남음"
  printf '%-24s %5s %7s  %s\n' "${shop%/}" "$n" "$min" "$note"
done
