"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type ShellOrganisation = {
  id: string;
  name: string;
  role?: string;
};

type AppShellProps = {
  organisations: ShellOrganisation[];
  activeOrganisationId: string;
  activeOrganisationName: string;
  userLabel: string;
  topContext?: string | null;
  previewMode?: boolean;
  signOutAction?: () => Promise<void>;
  children: React.ReactNode;
};

const navItems = [
  { key: "overview", label: "Overview", href: (id: string) => `/dashboard/${id}` },
  { key: "tenders", label: "Tenders", href: (id: string) => `/dashboard/${id}/tenders` },
  { key: "requirements", label: "Requirements", href: (id: string) => `/dashboard/${id}/requirements` },
  { key: "evidence", label: "Evidence", href: (id: string) => `/dashboard/${id}/evidence` },
  { key: "issues", label: "Issues", href: (id: string) => `/dashboard/${id}/issues` },
  { key: "reports", label: "Reports", href: (id: string) => `/dashboard/${id}/reports` },
  { key: "settings", label: "Settings", href: (id: string) => `/dashboard/${id}/settings` },
] as const;

function isActive(pathname: string, orgId: string, key: (typeof navItems)[number]["key"]) {
  const base = `/dashboard/${orgId}`;
  if (key === "overview") return pathname === base || pathname === `${base}/`;
  if (key === "settings") return pathname.startsWith(`${base}/settings`);
  if (key === "tenders") return pathname.startsWith(`${base}/tenders`);
  return pathname.startsWith(`${base}/${key}`);
}

export function AppShell({
  organisations,
  activeOrganisationId,
  activeOrganisationName,
  userLabel,
  topContext,
  previewMode = false,
  signOutAction,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--tgos-background)] text-[var(--tgos-text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--tgos-navy)] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      {previewMode ? (
        <div
          className="border-b border-[var(--tgos-warning-bg)] bg-[var(--tgos-warning-bg)] px-4 py-2 text-center text-xs font-semibold text-[var(--tgos-warning)]"
          role="status"
        >
          Local preview mode — demo data only. Nothing is saved.
        </div>
      ) : null}

      <div className="flex min-h-screen">
        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-[var(--tgos-navy)] text-white transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Primary"
        >
          <div className="flex items-center gap-2 px-4 py-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--tgos-info)] text-xs font-bold">TG</span>
            <div>
              <p className="text-sm font-semibold">TGOS</p>
              <p className="text-[11px] text-white/70">Tender Gate OS</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Workspace">
            {navItems.map((item) => {
              const href = item.href(activeOrganisationId);
              const active = isActive(pathname, activeOrganisationId, item.key);
              return (
                <Link
                  key={item.key}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-[10px] px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-white/15 px-2 py-3">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-white/50">Organisation</p>
            <div className="px-1">
              <select
                className="w-full rounded-[10px] border border-white/20 bg-[var(--tgos-primary)] px-2 py-2 text-sm text-white"
                aria-label="Organisation switcher"
                value={activeOrganisationId}
                onChange={(event) => {
                  window.location.href = `/dashboard/${event.target.value}`;
                }}
              >
                {organisations.map((organisation) => (
                  <option key={organisation.id} value={organisation.id}>
                    {organisation.name}
                    {organisation.role ? ` (${organisation.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <p className="px-3 py-2 text-xs text-white/75">{userLabel}</p>
            <Link
              href={`/dashboard/${activeOrganisationId}/settings/accessibility`}
              onClick={() => setOpen(false)}
              className="block rounded-[10px] px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Help and accessibility
            </Link>
            {previewMode ? (
              <Link href="/" className="block rounded-[10px] px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                Exit preview
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--tgos-border)] bg-[var(--tgos-surface)]">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--tgos-border)] text-xs font-semibold lg:hidden"
                  aria-label="Open navigation"
                  onClick={() => setOpen(true)}
                >
                  Menu
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--tgos-navy)]">{activeOrganisationName}</p>
                  <p className="truncate text-xs text-[var(--tgos-subtle)]">{topContext ?? "Workspace overview"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border border-[var(--tgos-border)] px-3 text-xs font-semibold text-[var(--tgos-muted)]"
                  aria-label="Notifications"
                >
                  Alerts
                </button>
                {signOutAction ? (
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--tgos-border)] px-3 text-xs font-semibold text-[var(--tgos-muted)]"
                    >
                      Sign out
                    </button>
                  </form>
                ) : (
                  <span className="rounded-[10px] border border-[var(--tgos-border)] px-3 py-2 text-xs font-semibold text-[var(--tgos-muted)]">
                    {userLabel}
                  </span>
                )}
              </div>
            </div>
          </header>

          <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
