#!/usr/bin/env python3
"""TEAM-STATUS.md 를 만든다 — 지금 누가 뭘 하고 있는지.

    python3 scripts/who.py

콜라보레이터는 GitHub에서 가져오므로 사람이 추가되면 자동으로 나타난다.
역할 라벨만 data/team.json 에 있다. 결과 파일은 gitignore — 파생 데이터라
커밋하면 세션마다 diff가 생기고, 원본(PR·커밋)은 이미 GitHub에 있다.

gh 두 번만 호출한다. SessionStart 훅에서 돌아서 느리면 안 된다.
"""
import json, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT, TEAM = ROOT / "TEAM-STATUS.md", ROOT / "data/team.json"


def gh(*args):
    r = subprocess.run(["gh", *args], capture_output=True, text=True, timeout=20)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None


def ago(iso):
    if not iso:
        return ""
    d = datetime.now(timezone.utc) - datetime.fromisoformat(iso.replace("Z", "+00:00"))
    h = d.days * 24 + d.seconds // 3600
    return f"{d.days}일 전" if d.days else (f"{h}시간 전" if h else "방금")


def main():
    roles = json.loads(TEAM.read_text())["roles"]
    repo = subprocess.run(["gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
                          capture_output=True, text=True).stdout.strip()
    people = gh("api", f"repos/{repo}/collaborators", "-q", "[.[].login]") or list(roles)
    prs = gh("pr", "list", "--state", "all", "--limit", "40", "--json",
             "number,title,author,state,updatedAt,mergedAt,isDraft") or []
    commits = gh("api", f"repos/{repo}/commits?per_page=60", "-q",
                 "[.[] | {login: .author.login, msg: .commit.message, date: .commit.author.date}]") or []

    lines = [f"# 지금 누가 뭘 하고 있나", "",
             f"`scripts/who.py` 자동 생성 · {datetime.now().strftime('%Y-%m-%d %H:%M')} · "
             f"[{repo}](https://github.com/{repo})", ""]

    for login in sorted(people, key=lambda p: (p not in roles, p)):
        mine = [p for p in prs if (p.get("author") or {}).get("login") == login]
        open_prs = [p for p in mine if p["state"] == "OPEN"]
        merged = [p for p in mine if p["state"] == "MERGED"]
        my_commits = [c for c in commits if c.get("login") == login]

        lines.append(f"## {login} — {roles.get(login, '역할 미지정')}")
        if open_prs:
            for p in open_prs:
                draft = " (draft)" if p.get("isDraft") else ""
                lines.append(f"- 🔄 **#{p['number']} {p['title']}**{draft} — {ago(p['updatedAt'])}")
        else:
            lines.append("- 열린 PR 없음")
        if merged:
            m = merged[0]
            lines.append(f"- ✅ 최근 머지 #{m['number']} {m['title']} — {ago(m['mergedAt'])}")
        if my_commits:
            c = my_commits[0]
            lines.append(f"- 📝 최근 커밋 `{c['msg'].splitlines()[0][:70]}` — {ago(c['date'])}")
        lines.append("")

    orphan = [p for p in prs if p["state"] == "OPEN"
              and (p.get("author") or {}).get("login") not in people]
    if orphan:
        lines += ["## 외부 기여자", *[f"- #{p['number']} {p['title']} (@{(p['author'] or {}).get('login')})"
                                   for p in orphan], ""]

    OUT.write_text("\n".join(lines))
    print(f"TEAM-STATUS.md — {len(people)}명, 열린 PR {sum(1 for p in prs if p['state']=='OPEN')}건")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:            # 훅에서 도니까 절대 세션을 막지 않는다
        print(f"who.py 건너뜀: {e}", file=sys.stderr)
