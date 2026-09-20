export const issueSeverityOrder = ["critical", "high", "medium", "low"] as const;
export type IssueSeverity = (typeof issueSeverityOrder)[number];

export const issueStateLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  awaiting_review: "Awaiting review",
  resolved: "Resolved",
  accepted_risk: "Accepted risk",
};

export const gateDecisionLabels: Record<string, string> = {
  go: "Go",
  conditional_go: "Conditional Go",
  no_go: "No-Go",
  in_progress: "In progress",
};

export function sortIssuesBySeverity<T extends { severity: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      issueSeverityOrder.indexOf(a.severity as IssueSeverity) -
      issueSeverityOrder.indexOf(b.severity as IssueSeverity),
  );
}

export function severityBadgeClass(severity: string) {
  if (severity === "critical") return "bg-[var(--tgos-critical-bg)] text-[var(--tgos-critical)]";
  if (severity === "high") return "bg-[var(--tgos-warning-bg)] text-[var(--tgos-warning)]";
  if (severity === "medium") return "bg-[var(--tgos-info-bg)] text-[var(--tgos-primary)]";
  return "bg-[var(--tgos-surface)] text-[var(--tgos-muted)]";
}
