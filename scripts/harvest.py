#!/usr/bin/env python3
"""시드 이미지 수집기. 규칙은 data/seed-shops.json 의 harvest 블록에 있다.

    python3 scripts/harvest.py              # 전체
    python3 scripts/harvest.py florence     # 특정 샵만

업체를 추가할 때 이 파일은 고치지 않는다 — seed-shops.json 에 harvest 블록만 넣는다.
새 플랫폼(cafe24 등)이 필요해지면 ADAPTERS 에 함수 하나를 추가한다.
"""
import json, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOPS, META, IMAGES = ROOT/"data/seed-shops.json", ROOT/"data/dress-meta.json", ROOT/"data/seed-images"
UA = "Mozilla/5.0"
CDN = re.compile(r'https://cdn\.imweb\.me/(?:upload|thumbnail)/[^"\' ]*\.(?:jpe?g|png)')


def fetch(url, binary=False):
    """curl 로 받는다. urllib 은 일부 샵 도메인의 중간 인증서를 못 잡는다 —
    curl 은 시스템 신뢰 저장소를 쓰므로 통한다 (normalize-seed.sh 와 같은 전제)."""
    r = subprocess.run(["curl", "-sL", "--max-time", "25", "-A", UA, url], capture_output=True)
    if r.returncode != 0 or not r.stdout:
        print(f"  ! {url} — curl {r.returncode}", file=sys.stderr)
        return None
    return r.stdout if binary else r.stdout.decode("utf-8", "replace")


def dims(path):
    """(width, height). sips 는 macOS 기본 도구다 (normalize-seed.sh 와 같은 전제)."""
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
                         capture_output=True, text=True).stdout
    got = dict(re.findall(r"(pixelWidth|pixelHeight): (\d+)", out))
    return int(got.get("pixelWidth", 0)), int(got.get("pixelHeight", 0))


def uniq(seq):
    """문서 순서 유지한 중복 제거. 정렬하면 갤러리 순서가 깨진다."""
    seen, out = set(), []
    for x in seq:
        if x not in seen:
            seen.add(x); out.append(x)
    return out


def next_free(out_dir, prefix):
    n = 1
    while (out_dir / f"{prefix}-{n:02d}.jpg").exists():
        n += 1
    return out_dir / f"{prefix}-{n:02d}.jpg"


def save_qualifying(urls, out_dir, prefix, want, min_width, done):
    """조건에 맞는 이미지를 want장까지 저장하고 [(파일명, 'WxH', 이미지URL)] 반환.

    경로(upload/ vs thumbnail/)로 걸러선 안 된다 — imweb 은 같은 경로에
    152x152 아이콘과 1920x2879 원본을 섞어 둔다. 해상도로만 판정한다.

    done: 이미 받아 둔 이미지 URL 집합. 부분 재개 시 이걸로 건너뛴다.
    파일 개수만 세서 건너뛰면, 이미 01 로 저장된 URL 을 다시 받아 03 으로
    저장하게 된다 (같은 사진이 파일명만 다르게 두 장). URL 로 판정해야 한다.
    """
    have = sorted(out_dir.glob(f"{prefix}-*.jpg"))
    if len(have) >= want:
        return []                            # 이미 채워졌다 — 네트워크도 타지 않는다
    saved = []
    for u in urls:
        if len(have) + len(saved) >= want:
            break
        if u in done:                        # 이 URL 은 이전 실행에서 이미 저장됐다
            continue
        blob = fetch(u, binary=True)
        if not blob:
            continue
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as t:
            t.write(blob); tmp = Path(t.name)
        w, h = dims(tmp)
        if h > w and w >= min_width:
            f = next_free(out_dir, prefix)   # 기존 파일을 덮지 않는다 (중간이 빈 경우)
            tmp.replace(f); saved.append((f.name, f"{w}x{h}", u))
        else:
            tmp.unlink(missing_ok=True)
    return saved


def imweb(shop, cfg, defaults, meta):
    """imweb 사이트. ?idx= 상품 링크가 있으면 상품 카탈로그, 없으면 갤러리 페이지."""
    out_dir = IMAGES / shop["handle"]; out_dir.mkdir(parents=True, exist_ok=True)
    min_width = cfg.get("min_width", defaults["min_width"])
    done = {v["image_url"] for v in meta.values() if v.get("image_url")}
    for entry in cfg["pages"]:
        # 문자열이면 샵 기본값, 객체면 그 페이지 전용 장수를 쓴다
        page_url = entry if isinstance(entry, str) else entry["url"]
        per_page = cfg.get("per_page", 3) if isinstance(entry, str) else entry.get("per_page", 3)
        page = fetch(page_url)
        if not page:
            continue
        idxs = sorted({int(m) for m in re.findall(r"idx=(\d+)", page)})
        slug = page_url.rstrip("/").rsplit("/", 1)[-1].split("?")[0]
        if idxs:
            for idx in idxs:
                detail = fetch(f"{page_url}/?idx={idx}")
                if not detail:
                    continue
                title = re.sub(r"\s*:.*", "", (re.search(r"<title>([^<]*)", detail) or [None, ""])[1]).strip()
                for name, dim, img in save_qualifying(uniq(CDN.findall(detail)), out_dir,
                                                     str(idx), per_page, min_width, done):
                    print(f"  {dim:11} {shop['handle']}/{name}  {title}")
                    meta[name] = parse_title(title) | {"source_url": f"{page_url}/?idx={idx}",
                                                       "image_url": img}
                    done.add(img)
        else:
            for name, dim, img in save_qualifying(uniq(CDN.findall(page)), out_dir,
                                                 slug, per_page, min_width, done):
                print(f"  {dim:11} {shop['handle']}/{name}  ({slug})")
                meta[name] = {"name": None, "name_en": None, "price_note": None,
                              "collection": slug, "source_url": page_url, "image_url": img}
                done.add(img)


def parse_title(title):
    """'루나, Luna (대여가 85만원)' → 이름 / 영문명 / 가격"""
    m = re.match(r"^\s*([^,(]+?)\s*(?:,\s*([^(]+?))?\s*(?:\((.+)\))?\s*$", title)
    g = (lambda i: (m.group(i) or "").strip() or None) if m else (lambda i: None)
    return {"name": g(1) or title, "name_en": g(2), "price_note": g(3), "collection": None}


def manual(shop, cfg, defaults, meta):
    n = len(list((IMAGES / shop["handle"]).glob("*.jpg"))) if (IMAGES / shop["handle"]).exists() else 0
    print(f"  수동 수집 — {n}장. {cfg.get('note','')}")


ADAPTERS = {"imweb": imweb, "manual": manual}

if __name__ == "__main__":
    data = json.loads(SHOPS.read_text())
    defaults = data["_defaults"]
    all_meta = json.loads(META.read_text()) if META.exists() else {}
    only = set(sys.argv[1:])
    for shop in data["shops"]:
        cfg = shop.get("harvest")
        if not cfg or (only and shop["handle"] not in only):
            continue
        fn = ADAPTERS.get(cfg["adapter"])
        if not fn:
            print(f"{shop['name']}: adapter '{cfg['adapter']}' 없음 — ADAPTERS 에 추가할 것", file=sys.stderr); continue
        print(f"\n{shop['name']} ({shop['handle']}) [{cfg['adapter']}]")
        meta = all_meta.setdefault(shop["handle"], {})
        fn(shop, cfg, defaults, meta)
    META.write_text(json.dumps(all_meta, ensure_ascii=False, indent=2) + "\n")
    print(f"\n{sum(len(v) for v in all_meta.values())}장 메타데이터 기록")
