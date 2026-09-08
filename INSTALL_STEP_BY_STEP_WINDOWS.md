# TENDER.GATE.OS — Step-by-step install (Windows / PowerShell)

Every step has a **CHECK**. Do not move to the next step until the check passes. If a check fails, the fix is written directly under it.

The most common way this goes wrong is mixing new files into an old folder. Step 2 prevents that and is not optional.

---

## Step 0 — Confirm Node is installed and new enough

Open **PowerShell** (not Command Prompt).

```powershell
node --version
```

**CHECK:** you see `v22.` or higher, for example `v22.22.2`.

**If it fails**
- `node : The term 'node' is not recognized` → Node is not installed. Download the LTS installer from nodejs.org, run it, **close PowerShell completely and reopen it**, then run the command again.
- You see `v18.` or `v20.` → too old. Install the current LTS over the top, close and reopen PowerShell.

Reopening the window matters. PowerShell does not pick up a new PATH in a session that was already open.

---

## Step 1 — Decide where the project lives

```powershell
cd $HOME
mkdir Projects -Force
cd Projects
pwd
```

**CHECK:** `pwd` prints something ending in `\Projects`, for example `C:\Users\Donny\Projects`.

Avoid OneDrive-synced folders (`Documents`, `Desktop`) for code. OneDrive locks files mid-write and produces errors that look like code bugs but are not.

---

## Step 2 — Create a clean folder. Do not reuse anything.

```powershell
mkdir tender-gate-os
cd tender-gate-os
pwd
Get-ChildItem
```

**CHECK:** `pwd` ends in `\Projects\tender-gate-os`, and `Get-ChildItem` prints **nothing at all**.

An empty folder is the point of this step. If anything is listed, you are in the wrong place — go back and use a name that does not already exist.

**Do not** unzip into the old DOCCUTE folder. **Do not** copy old files in "just in case". The old pack cites withdrawn policy; a stray copy is how the wrong PPN reaches a customer.

---

## Step 3 — Unzip the pack here

Move `TENDER_GATE_OS_Pack_2026-09-07.zip` into this folder first, then:

```powershell
Expand-Archive -Path .\TENDER_GATE_OS_Pack_2026-09-07.zip -DestinationPath . -Force
Get-ChildItem
```

**CHECK:** you see a folder named `TENDER_GATE_OS_Pack_2026-09-07`.

**If it fails**
- `Expand-Archive : Cannot find path` → the zip is not in this folder. Run `Get-ChildItem *.zip` to confirm. Drag it in from Downloads, or give the full path: `Expand-Archive -Path "$HOME\Downloads\TENDER_GATE_OS_Pack_2026-09-07.zip" -DestinationPath . -Force`
- Windows blocks the file because it came from the internet → `Unblock-File .\TENDER_GATE_OS_Pack_2026-09-07.zip` then retry.

---

## Step 4 — Flatten the nested folder

The zip contains one folder inside. Lift its contents up one level so the paths in the docs match what you have.

```powershell
Move-Item .\TENDER_GATE_OS_Pack_2026-09-07\* . -Force
Remove-Item .\TENDER_GATE_OS_Pack_2026-09-07 -Recurse -Force
Get-ChildItem
```

**CHECK:** you see exactly these four entries:

```
docs
tools
00_READ_FIRST.md
TENDER_GATE_OS_Pack_2026-09-07.zip
```

**If `docs` and `tools` are missing** but a folder name remains, the move did not run. Run the three commands again in order.

---

## Step 5 — Confirm every file arrived

```powershell
Get-ChildItem -Recurse -File | Measure-Object | Select-Object Count
```

**CHECK:** `Count` is **21** — 20 pack files plus the zip.

```powershell
Get-ChildItem .\tools
```

**CHECK:** exactly six files:

```
regulatory-dataset.json
rules.mjs
rules.test.mjs
tokens.mjs
tokens.test.mjs
validate.mjs
```

If any is missing, delete the whole folder and start again from Step 2. A partial extract fails in confusing ways later; re-extracting is faster than diagnosing it.

---

## Step 6 — Run the three verification commands

This is the step that tells you the pack is sound. Run all three.

```powershell
cd tools
node validate.mjs
```

**CHECK:** the last line reads

```
RESULT: PASS — all entries carry sufficient evidence.
```

```powershell
node rules.test.mjs
```

**CHECK:** near the end you see `passed 29   failed 0`

```powershell
node tokens.test.mjs
```

**CHECK:** near the end you see `passed 42   failed 0`

**If any command fails**

- `Cannot find module` → you are not in the `tools` folder. Run `pwd`; it must end in `\tools`.
- `SyntaxError: Unexpected token` → Node is too old. Return to Step 0.
- `Cannot find package 'node:fs'` → same cause, Node too old.
- Any test reports `failed` with a number above 0 → **stop and tell me the exact output.** Do not proceed. That means something in the pack is genuinely wrong and I need to fix it, not you.

---

## Step 7 — Prove the validator can fail

A checker that always passes tells you nothing. Confirm it blocks stale data.

```powershell
$env:TGOS_TODAY="2027-02-01"
node validate.mjs
```

**CHECK:** the last line now reads

```
RESULT: FAIL — N blocker(s). Dataset must not ship.
```

You should see `[STALE]` and `[CHANGE_DATE_PASSED]` entries above it. That is correct behaviour — you told it the date is February 2027, and values verified in September 2026 are past their review age.

**Now clear the variable, or every later run will keep failing:**

```powershell
Remove-Item Env:\TGOS_TODAY
node validate.mjs
```

**CHECK:** back to `RESULT: PASS`.

If you forget this step, close PowerShell and open a new window. The variable does not survive.

---

## Step 8 — Open in VS Code or Cursor

```powershell
cd ..
code .
```

For Cursor use `cursor .` instead.

**CHECK:** the editor opens with `docs` and `tools` in the sidebar, and the title bar shows `tender-gate-os`.

If `code` is not recognised: open VS Code manually, press `Ctrl+Shift+P`, type `shell command`, and select **Install 'code' command in PATH**. Then reopen PowerShell.

---

## Step 9 — Read in this order

Open these from the sidebar. Do not read everything.

1. `00_READ_FIRST.md` — read fully, it is short
2. `docs/07_CORRECTIONS_REGISTER.md` — what was wrong before and why it mattered
3. `docs/08_LOCKED_DECISIONS.md` — read the **status column**, not just the rows

That is enough to start. The rest are reference documents you open when you need them.

---

## Step 10 — Start building

The M01 prompt is in `docs/11_MILESTONE_PROMPTS.md`.

Give a coding agent **section 0 (standing constraints) plus the M01 block**. Both. Section 0 alone does nothing; M01 alone loses every constraint that stops the previous defects returning.

Before accepting anything the agent returns, run this yourself:

```powershell
cd tools
node validate.mjs
node rules.test.mjs
node tokens.test.mjs
```

Do not accept "tests pass" as a statement. Run them.

---

## Daily use

Every time you sit down:

```powershell
cd $HOME\Projects\tender-gate-os\tools
node validate.mjs
```

If it says FAIL, a regulatory value has reached its review date. Read which entry and re-verify it against its source URL before doing anything else that day.

That single command is the whole maintenance routine.

---

## Quick reference

| What | Command |
|---|---|
| Go to the project | `cd $HOME\Projects\tender-gate-os` |
| Check regulatory data | `cd tools; node validate.mjs` |
| Check compliance rules | `node rules.test.mjs` |
| Check document gate | `node tokens.test.mjs` |
| Open in editor | `cd ..; code .` |

---

## If something is wrong

Copy the **exact** text PowerShell printed, including the error, and send it. Do not summarise it. The error text names the cause; a summary usually loses it.
