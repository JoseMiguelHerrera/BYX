"use client";

import { useEffect, useRef, useState } from "react";

const FEEDBACK_DURATION_MS = 1500;

/**
 * Copies `value` to the clipboard and swaps its icon to a checkmark for a
 * moment so the click has visible feedback. Used by the dashboard top bar and
 * the Funding deposit instructions.
 */
export default function CopyButton({
  value,
  className = "",
  title = "Copy address",
}: {
  value: string;
  className?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A pending timer must not fire after unmount: the user can leave the Funding
  // tab within the feedback window and would otherwise trigger a state update
  // on an unmounted component.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // The Clipboard API is unavailable outside a secure context (for example
      // plain HTTP on a LAN IP). Showing the copied state here would claim a
      // copy that never happened, so the icon stays unchanged.
      return;
    }

    setCopied(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(
      () => setCopied(false),
      FEEDBACK_DURATION_MS,
    );
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={className}
      title={copied ? "Copied" : title}
      aria-label={copied ? "Copied" : title}
    >
      <span aria-live="polite">{copied ? "✅" : "📋"}</span>
    </button>
  );
}
