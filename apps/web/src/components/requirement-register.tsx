"use client";

import { useEffect, useId, useRef, useState } from "react";

export type RequirementRow = {
  id: string;
  title: string;
  requirementText: string;
  classification: string;
  status: string;
  sourcePage: number;
  sourceSection: string;
  sourceDocumentTitle?: string | null;
  linkedEvidence: Array<{ id: string; title: string }>;
  dueAt?: string | null;
};

type Props = {
  requirements: RequirementRow[];
  canManage?: boolean;
  children?: React.ReactNode;
};

function statusClass(status: string) {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  if (normalized.includes("risk") || normalized === "open") return "bg-[var(--tgos-warning-bg)] text-[var(--tgos-warning)]";
  if (normalized.includes("satisf") || normalized === "ready") return "bg-[var(--tgos-success-bg)] text-[var(--tgos-success)]";
  if (normalized.includes("waiv")) return "bg-[var(--tgos-info-bg)] text-[var(--tgos-info)]";
  return "bg-[var(--tgos-surface-subtle)] text-[var(--tgos-muted)]";
}

export function RequirementRegister({ requirements, children }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const selected = requirements.find((item) => item.id === selectedId) ?? null;

  const filtered = requirements.filter((item) => {
    const haystack = `${item.title} ${item.requirementText} ${item.classification} ${item.status}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  useEffect(() => {
    if (!selected) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    if (selected) return;
    lastFocus.current?.focus?.();
  }, [selected]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm font-medium text-[var(--tgos-text)]">
          Search requirements
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 block min-h-11 w-full min-w-[240px] rounded-[10px] border border-[var(--tgos-border)] px-3 py-2"
            placeholder="Search title, text, status"
          />
        </label>
        <p className="text-sm text-[var(--tgos-subtle)]" aria-live="polite">
          Showing {filtered.length} of {requirements.length} requirements
        </p>
      </div>

      {children}

      <div className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Requirement register</caption>
          <thead className="bg-[var(--tgos-surface-subtle)] text-xs text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-3 py-2" scope="col">Requirement</th>
              <th className="px-3 py-2" scope="col">Type</th>
              <th className="px-3 py-2" scope="col">Evidence</th>
              <th className="px-3 py-2" scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-[var(--tgos-border)]">
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="text-left font-semibold text-[var(--tgos-primary)] underline-offset-2 hover:underline"
                    onClick={() => setSelectedId(item.id)}
                  >
                    {item.title}
                  </button>
                </td>
                <td className="px-3 py-3 capitalize">{item.classification}</td>
                <td className="px-3 py-3">{item.linkedEvidence.length ? `${item.linkedEvidence.length} linked` : "Missing"}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${statusClass(item.status)}`}>
                    {item.status.replaceAll("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr className="border-t border-[var(--tgos-border)]">
                <td className="px-3 py-6 text-[var(--tgos-muted)]" colSpan={4}>No requirements match this filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/40" aria-label="Close requirement detail" onClick={() => setSelectedId(null)} />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-[var(--tgos-border)] bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tgos-subtle)]">{selected.classification}</p>
                <h2 id={titleId} className="mt-1 text-xl font-semibold text-[var(--tgos-navy)]">{selected.title}</h2>
                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold capitalize ${statusClass(selected.status)}`}>
                  {selected.status.replaceAll("_", " ")}
                </span>
              </div>
              <button ref={closeRef} type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--tgos-border)]" aria-label="Close" onClick={() => setSelectedId(null)}>
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--tgos-subtle)]">Exact requirement text</p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--tgos-text)]">{selected.requirementText}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--tgos-subtle)]">Source</p>
                <p className="mt-1 text-[var(--tgos-muted)]">
                  {selected.sourceDocumentTitle ?? "Source document"} · page {selected.sourcePage} · {selected.sourceSection}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--tgos-subtle)]">Matched evidence</p>
                {selected.linkedEvidence.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {selected.linkedEvidence.map((item) => <li key={item.id}>{item.title}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-[var(--tgos-warning)]">No supporting evidence linked.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--tgos-subtle)]">TGOS analysis</p>
                <p className="mt-1 text-[var(--tgos-muted)]">
                  {selected.linkedEvidence.length
                    ? "Evidence is linked. Human review is still required before treating this as submission-ready."
                    : "Potential gap identified. No supporting evidence was found linked to this requirement."}
                </p>
              </div>
              <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-3 py-2 text-[var(--tgos-primary)]" role="note">
                AI-assisted analysis. Human review and approval are required before tender submission.
              </p>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
