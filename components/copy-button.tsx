"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** Copies a string and confirms it. Falls back to selecting the text when the
 *  clipboard API is unavailable, which is the case on some older mobile
 *  browsers and any non-HTTPS origin. */
export function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setFailed(false);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setFailed(true);
        }
      }}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1 rounded bg-navy-800 px-2.5 py-1.5 font-display text-xs font-semibold text-white hover:bg-navy-700"
      }
      title={failed ? "Couldn't copy — select the text manually" : undefined}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : failed ? "Select it" : label}
    </button>
  );
}
