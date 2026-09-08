import { checkF9 } from "../../../../tools/tokens.mjs";

export function evaluateEvidenceValidity(
  evidenceItems: Array<{ id: string; expires_on: string | null }>,
  contractStartDate: string | null,
) {
  return checkF9(
    evidenceItems.map((item) => ({
      expiryDate: item.expires_on,
      id: item.id,
    })),
    contractStartDate,
  ) as {
    status: "pass" | "fail" | "unknown";
    message: string;
    unknown?: string[];
    expired?: string[];
  };
}
