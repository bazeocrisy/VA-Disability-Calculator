export type ReleaseApprovalResult =
  | { ok: true; reviewer: string; date: string }
  | { ok: false; reason: string };

export function checkReleaseApproval(markdown: string, reviewer: string, today?: string): ReleaseApprovalResult;
