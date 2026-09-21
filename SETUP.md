# TGOS — Setup on any machine

**Goal:** clone the repo and run it on Windows, macOS, or Linux with the same steps.

**Product scope (locked):** this is a **document checking** platform (gaps, grammar, word count, alerts) grounded in the **Procurement Act 2023**. It does **not** create or generate submission documents.

---

## Requirements

| Tool | Version | Notes |
|------|---------|--------|
| **Node.js** | **22 or later** | Required for `tools/` validators and tests |
| **npm** | comes with Node | Workspaces are used at the repo root |
| **Git** | any recent | |
| **Docker Desktop** | optional for Phase 0 | Only needed later for local Supabase + RLS tests |
| **Supabase CLI** | optional for Phase 0 | Same — database gates need it |

Check Node:

```bash
node --version   # must print v22.x or higher
npm --version
```

If Node is missing or too old: install current LTS from [nodejs.org](https://nodejs.org), then **open a new terminal** so PATH updates.

---

## 1. Clone

```bash
git clone https://github.com/Donny1717/TGOS.git
cd TGOS
```

Private repo: use SSH or a credential that can access `Donny1717/TGOS`.

Avoid putting the repo inside OneDrive/iCloud-synced folders if you can; file locking causes confusing install errors.

---

## 2. Install dependencies

From the **repo root** (where this file lives):

```bash
npm install
```

This installs the root workspace and `apps/web`.

**CHECK:** command exits 0 and `node_modules/` exists at the root.

---

## 3. Environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

For **local UI only** (landing + existing pages, no real Supabase):

1. Open `.env`
2. Set `DISABLE_AUTH=true` **only** for local development on your machine
3. You can leave Supabase keys as `replace_me` until you connect a project

`DISABLE_AUTH=true` is ignored unless `NODE_ENV=development` and you are not on Vercel/CI. Never set it in production.

When you are ready for real auth + data:

- Create a Supabase project (or run `supabase start` with Docker)
- Put real values into `SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*`
- Set `DISABLE_AUTH=false`

---

## 4. Verify regulatory tools (must pass before trusting the pack)

From the **repo root**:

```bash
npm run verify
```

Or manually:

```bash
npm run validate:regulatory
npm run test:rules
npm run test:tokens
```

**CHECK:**

- validate → `RESULT: PASS`
- rules → `passed 29   failed 0`
- tokens → `passed 42   failed 0`

Prove the validator can fail (then clear the override):

```bash
# macOS / Linux
TGOS_TODAY=2027-02-01 npm run validate:regulatory
# should FAIL (stale / change-date passed)

npm run validate:regulatory
# should PASS again
```

```powershell
# Windows PowerShell
$env:TGOS_TODAY="2027-02-01"
npm run validate:regulatory
Remove-Item Env:\TGOS_TODAY
npm run validate:regulatory
```

If any check fails with `failed` > 0 or unexpected errors, **stop** and fix before developing UI. Do not skip this gate.

---

## 5. Run the web app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You should see the TGOS landing page.

**CHECK:** browser loads without a build crash. Auth-protected dashboard routes need real Supabase (or local bypass as above).

Stop the server with `Ctrl+C`.

---

## 6. Optional — local Supabase (later phases)

Not required for Phase 0 (landing + static shell + tools verification).

When you need RLS / migrations:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it
2. Install [Supabase CLI](https://supabase.com/docs/guides/cli)
3. From repo root:

```bash
supabase start
# copy printed URL and keys into .env
npm run test:rls    # when ready
```

---

## Daily commands

| Task | Command (from repo root) |
|------|---------------------------|
| Install | `npm install` |
| Verify tools | `npm run verify` |
| Dev server | `npm run dev` |
| Lint web | `npm --workspace web run lint` |
| Build web | `npm --workspace web run build` |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `node: command not found` | Node not installed / PATH | Install Node 22+, new terminal |
| `SyntaxError` / odd ESM errors in `tools/` | Node < 22 | Upgrade Node |
| `npm install` fails in workspace | Ran from wrong folder | `cd` to repo root (has root `package.json`) |
| Port 3000 in use | Another process | Stop it or `npx next dev -p 3001` inside `apps/web` |
| Auth loops / empty dashboard | No Supabase + `DISABLE_AUTH=false` | Set local bypass or configure Supabase |
| Validator always FAIL | `TGOS_TODAY` still set | Unset the env var, open new shell |

---

## What to read next

1. `00_READ_FIRST.md` — product constraint and corrections history  
2. `docs/STATUS_AND_NEXT.md` — what is already built vs open  
3. `docs/06_COMPLIANCE_RULES.md` — the six PA23-aligned rules  
4. Phase plan: run on every machine first, then fill checking features (grammar, word count, alerts)

Windows-only unpack guide for the **legacy pack zip** (not this full repo): `INSTALL_STEP_BY_STEP_WINDOWS.md`.
