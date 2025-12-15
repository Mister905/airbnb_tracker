import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from "diff-match-patch";

const dmp = new diff_match_patch();

export interface TextDiffSegment {
  type: "added" | "removed" | "unchanged";
  text: string;
}

export function createTextDiffSegments(oldText: string, newText: string): TextDiffSegment[] {
  const diffs = dmp.diff_main(oldText || "", newText || "");
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([operation, text]) => {
    if (operation === DIFF_INSERT) {
      return { type: "added" as const, text };
    } else if (operation === DIFF_DELETE) {
      return { type: "removed" as const, text };
    } else {
      return { type: "unchanged" as const, text };
    }
  });
}

export function createTextDiff(oldText: string, newText: string): string {
  const diffs = dmp.diff_main(oldText || "", newText || "");
  dmp.diff_cleanupSemantic(diffs);

  let html = "";
  for (const [operation, text] of diffs) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    if (operation === DIFF_INSERT) {
      // Green background for additions
      html += `<span class="bg-green-200 text-green-900 px-0.5 py-0.5 rounded font-medium">${escaped}</span>`;
    } else if (operation === DIFF_DELETE) {
      // Red background with strikethrough for deletions
      html += `<span class="bg-red-200 text-red-900 px-0.5 py-0.5 rounded line-through decoration-red-600 font-medium">${escaped}</span>`;
    } else {
      html += escaped;
    }
  }

  return html;
}

// Enhanced diff for word-level highlighting with yellow for modified sections
export function createEnhancedTextDiff(oldText: string, newText: string): string {
  const diffs = dmp.diff_main(oldText || "", newText || "");
  dmp.diff_cleanupSemantic(diffs);

  let html = "";
  let prevType: number | null = null;
  
  for (let i = 0; i < diffs.length; i++) {
    const [operation, text] = diffs[i];
    const nextOperation = i < diffs.length - 1 ? diffs[i + 1][0] : null;
    
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    // Check if this is part of a modification (delete followed by insert)
    const isModified = operation === DIFF_DELETE && nextOperation === DIFF_INSERT;
    const isModifiedInsert = operation === DIFF_INSERT && prevType === DIFF_DELETE;

    if (operation === DIFF_INSERT && isModifiedInsert) {
      // Yellow background for modified sections (insertions that follow deletions)
      html += `<span class="bg-yellow-200 text-yellow-900 px-0.5 py-0.5 rounded font-medium">${escaped}</span>`;
    } else if (operation === DIFF_INSERT) {
      // Green background for pure additions
      html += `<span class="bg-green-200 text-green-900 px-0.5 py-0.5 rounded font-medium">${escaped}</span>`;
    } else if (operation === DIFF_DELETE && isModified) {
      // Yellow background for modified sections (deletions that precede insertions)
      html += `<span class="bg-yellow-200 text-yellow-900 px-0.5 py-0.5 rounded font-medium line-through decoration-yellow-600">${escaped}</span>`;
    } else if (operation === DIFF_DELETE) {
      // Red background with strikethrough for pure deletions
      html += `<span class="bg-red-200 text-red-900 px-0.5 py-0.5 rounded line-through decoration-red-600 font-medium">${escaped}</span>`;
    } else {
      html += escaped;
    }
    
    prevType = operation;
  }

  return html;
}

