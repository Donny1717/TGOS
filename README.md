# TGOS — Tender Gate OS

UK public-sector **document checking** platform (Honey-B2024 Ltd).

**What it does:** detects missing evidence and requirement gaps, supports compliance checks aligned with the **Procurement Act 2023**, and (roadmap) grammar + word-count checks with alerts.

**What it does not do:** create or generate submission documents.

---

## Run on any machine

```bash
git clone https://github.com/Donny1717/TGOS.git
cd TGOS
npm install
cp .env.example .env   # set DISABLE_AUTH=true for local UI-only
npm run verify         # regulatory + rules + tokens must pass
npm run dev            # http://localhost:3000
```

Full steps, troubleshooting, and Supabase notes: **[SETUP.md](./SETUP.md)**

---

## Repo map

| Path | Role |
|------|------|
| `apps/web` | Next.js app (landing + dashboard UI) |
| `tools/` | Regulatory dataset, PA23-oriented rules, validators & tests |
| `docs/` | Product, architecture, status, compliance |
| `supabase/` | Migrations and DB gate tests |

**Start reading:** `00_READ_FIRST.md` → `docs/STATUS_AND_NEXT.md`

**Do not** recreate M00–M03 from old milestone prompts — see status doc.
