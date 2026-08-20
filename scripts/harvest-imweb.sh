#!/bin/bash
# imweb 기반 드레스샵 컬렉션에서 상품별 대표 이미지 1장 + 메타데이터를 받는다.
#   ./scripts/harvest-imweb.sh <handle> <컬렉션 URL>
#   예: ./scripts/harvest-imweb.sh fleuve_atelier https://fleuve-atelier.com/98
#
# 상품 상세 페이지에는 두 계열이 섞여 있다.
#   thumbnail/... = 600x600 하단 썸네일 스트립  ← 쓰지 않는다
#   upload/...    = 1920x2876 메인 뷰어 원본    ← 이걸 받는다
# 세로 비율(h>w)인 첫 장만 받는다. 가로는 디테일컷이라 실루엣이 안 보인다.
set -uo pipefail   # -e 제외: 한 상품이 실패해도 나머지를 계속 받는다
HANDLE="${1:?handle 필요}"; INDEX="${2:?컬렉션 URL 필요}"
UA='Mozilla/5.0'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/seed-images/$HANDLE"; META="$ROOT/data/dress-meta.json"
mkdir -p "$OUT"; [ -f "$META" ] || echo '{}' > "$META"
BASE="$(echo "$INDEX" | grep -oE 'https?://[^/]+')"

rows=""
for idx in $(curl -sL --max-time 20 -A "$UA" "$INDEX" | grep -oE 'idx=[0-9]+' | sort -u -t= -k2 -n); do
  existing="$OUT/${idx#idx=}.jpg"
  if [ -s "$existing" ]; then echo "있음  $HANDLE/${idx#idx=}.jpg"; fi
  html=$(curl -sL --max-time 20 -A "$UA" "$INDEX/?$idx") || continue
  title=$(printf '%s' "$html" | tr '\n' ' ' | grep -oE '<title>[^<]*' | sed 's/<title>//' | sed 's/ *:.*//')
  # 문서 순서를 유지한 채 중복만 제거 — sort하면 갤러리 순서가 깨진다
  urls=$(printf '%s' "$html" | grep -oE 'https://cdn\.imweb\.me/upload/[^"'"'"' ]*\.(jpg|jpeg|png)' | awk '!seen[$0]++')
  saved=""
  if [ -s "$existing" ]; then saved="${idx#idx=}.jpg"; fi
  for u in $urls; do
    [ -n "$saved" ] && break
    tmp=$(mktemp); curl -sL --max-time 20 -A "$UA" "$u" -o "$tmp" || { rm -f "$tmp"; continue; }
    read -r w h < <(sips -g pixelWidth -g pixelHeight "$tmp" 2>/dev/null | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w" "h}')
    if [ "${h:-0}" -gt "${w:-0}" ] && [ "${w:-0}" -ge 1000 ]; then
      saved="${idx#idx=}.jpg"; mv "$tmp" "$OUT/$saved"; echo "받음  $HANDLE/$saved  ${w}x${h}  $title"; break
    fi
    rm -f "$tmp"
  done
  [ -z "$saved" ] && { echo "건너뜀 $idx  세로 원본 없음" >&2; continue; }
  rows="$rows$(printf '%s\t%s\t%s\t%s\n' "${idx#idx=}" "$saved" "$title" "$BASE/${INDEX##*/}/?$idx")"$'\n'
done

printf '%s' "$rows" | python3 -c '
import json,sys,os,re
handle,meta_path=sys.argv[1],sys.argv[2]
meta=json.load(open(meta_path))
items=meta.setdefault(handle,{})
for line in sys.stdin:
    if not line.strip(): continue
    idx,f,title,url=line.rstrip("\n").split("\t")
    # "루나, Luna (대여가 85만원)" → 이름 / 영문명 / 가격
    m=re.match(r"^\s*([^,(]+?)\s*(?:,\s*([^(]+?))?\s*(?:\((.+)\))?\s*$",title)
    items[idx]={"file":f,"name":(m.group(1) or "").strip() if m else title,
                "name_en":(m.group(2) or "").strip() if m and m.group(2) else None,
                "price_note":(m.group(3) or "").strip() if m and m.group(3) else None,
                "source_url":url}
json.dump(meta,open(meta_path,"w"),ensure_ascii=False,indent=2); open(meta_path,"a").write("\n")
print(f"\n{handle}: {len(items)}벌 메타데이터 기록")
' "$HANDLE" "$META"
