"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
};

export default function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}