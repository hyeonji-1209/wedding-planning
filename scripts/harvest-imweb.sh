#!/bin/bash
# imweb 드레스샵에서 원본 이미지 + 있으면 메타데이터를 받는다.
#   ./scripts/harvest-imweb.sh <handle> <URL> [장수]
#
# 두 종류의 컬렉션을 자동으로 가른다.
#   상품 카탈로그 (?idx= 링크 있음) → 상품별 대표 1장 + 제목에서 이름·대여가
#   갤러리 페이지 (링크 없음)       → 그 페이지에서 [장수]만큼
#
# 판정은 URL 경로가 아니라 해상도로 한다. imweb의 thumbnail/ 은 크기를 뜻하지
# 않는다 — 같은 경로에 152x152 아이콘과 1920x2879 원본이 섞여 있다.
# 세로(h>w)이고 가로 1000px 이상만 받는다. 가로 사진은 디테일컷이라 실루엣이 안 보인다.
set -uo pipefail
HANDLE="${1:?handle 필요}"; URL="${2:?URL 필요}"; WANT="${3:-3}"
UA='Mozilla/5.0'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/seed-images/$HANDLE"; META="$ROOT/data/dress-meta.json"
mkdir -p "$OUT"; [ -f "$META" ] || echo '{}' > "$META"

# 문서 순서를 유지한 채 중복만 제거. sort하면 갤러리 순서가 깨진다.
candidates() { grep -oE 'https://cdn\.imweb\.me/(upload|thumbnail)/[^"'"'"' ]*\.(jpe?g|png)' | awk '!s[$0]++'; }

# 조건에 맞는 첫 N장을 받는다. $1=페이지HTML $2=파일명 접두어 $3=원하는 장수
grab() {
  local html="$1" prefix="$2" want="$3" got=0 tmp w h
  while read -r u; do
    [ "$got" -ge "$want" ] && break
    tmp=$(mktemp); curl -sL --max-time 20 -A "$UA" "$u" -o "$tmp" || { rm -f "$tmp"; continue; }
    read -r w h < <(sips -g pixelWidth -g pixelHeight "$tmp" 2>/dev/null | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w+0" "h+0}')
    if [ "$h" -gt "$w" ] && [ "$w" -ge 1000 ]; then
      got=$((got+1)); f="$prefix-$(printf %02d $got).jpg"; mv "$tmp" "$OUT/$f"
      echo "$f	${w}x${h}"
    else rm -f "$tmp"; fi
  done < <(printf '%s' "$html" | candidates)
}

page=$(curl -sL --max-time 25 -A "$UA" "$URL")
idxs=$(printf '%s' "$page" | grep -oE 'idx=[0-9]+' | sort -u -t= -k2 -n)
slug="${URL##*/}"; slug="${slug%%\?*}"
rows=""

if [ -n "$idxs" ]; then
  for idx in $idxs; do
    d=$(curl -sL --max-time 25 -A "$UA" "$URL/?$idx") || continue
    title=$(printf '%s' "$d" | tr '\n' ' ' | grep -oE '<title>[^<]*' | sed 's/<title>//;s/ *:.*//')
    out=$(grab "$d" "${idx#idx=}" 1)
    [ -z "$out" ] && { echo "건너뜀 $idx" >&2; continue; }
    f="${out%%	*}"; echo "받음  $HANDLE/$f  ${out##*	}  $title"
    rows="$rows$(printf '%s\t%s\t%s\n' "$f" "$title" "$URL/?$idx")"$'\n'
  done
else
  while IFS=$'\t' read -r f dim; do
    [ -z "$f" ] && continue
    echo "받음  $HANDLE/$f  $dim  ($slug)"
    rows="$rows$(printf '%s\t%s\t%s\n' "$f" "$slug" "$URL")"$'\n'
  done < <(grab "$page" "$slug" "$WANT")
fi

printf '%s' "$rows" | python3 -c '
import json,sys,re
handle,meta_path=sys.argv[1],sys.argv[2]
meta=json.load(open(meta_path)); items=meta.setdefault(handle,{})
n=0
for line in sys.stdin:
    if not line.strip(): continue
    f,title,url=line.rstrip("\n").split("\t"); n+=1
    m=re.match(r"^\s*([^,(]+?)\s*(?:,\s*([^(]+?))?\s*(?:\((.+)\))?\s*$",title)
    items[f]={"name":(m.group(1) or "").strip() if m else title,
              "name_en":(m.group(2) or "").strip() if m and m.group(2) else None,
              "price_note":(m.group(3) or "").strip() if m and m.group(3) else None,
              "source_url":url}
json.dump(meta,open(meta_path,"w"),ensure_ascii=False,indent=2); open(meta_path,"a").write("\n")
print(f"  → {n}장 기록 (누적 {len(items)})")
' "$HANDLE" "$META"
