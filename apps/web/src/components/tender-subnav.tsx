import Link from "next/link";

type Props = {
  organisationId: string;
  tenderId: string;
  current: "overview" | "documents" | "requirements" | "evidence" | "issues" | "final-gate" | "report";
};

export function TenderSubnav({ organisationId, tenderId, current }: Props) {
  const items = [
    ["overview", "Overview", `/dashboard/${organisationId}/tenders/${tenderId}`],
    ["documents", "Documents", `/dashboard/${organisationId}/tenders/${tenderId}/documents`],
    ["requirements", "Requirements", `/dashboard/${organisationId}/tenders/${tenderId}/requirements`],
    ["evidence", "Evidence", `/dashboard/${organisationId}/tenders/${tenderId}/evidence`],
    ["issues", "Issues", `/dashboard/${organisationId}/tenders/${tenderId}/issues`],
    ["final-gate", "Final gate", `/dashboard/${organisationId}/tenders/${tenderId}/final-gate`],
    ["report", "Report", `/dashboard/${organisationId}/tenders/${tenderId}/report`],
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Tender sections">
      {items.map(([key, label, href]) => (
        <Link
          key={key}
          href={href}
          aria-current={current === key ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-[10px] px-3 text-sm font-semibold ${
            current === key
              ? "bg-[var(--tgos-primary)] text-white"
              : "border border-[var(--tgos-border)] bg-white text-[var(--tgos-text)]"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
