"use client";
import { useState } from "react";

type Props = {
  label: string;
  confirmMessage: string;
  className?: string;
};

export function ConfirmSubmitButton({ label, confirmMessage, className }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      {!open ? (
        <button type="button" className={className} onClick={() => setOpen(true)} disabled={busy}>
          {label}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
          <span>{confirmMessage}</span>
          <button type="button" className="rounded border px-2 py-1" disabled={busy} onClick={() => setOpen(false)}>
            Zrušit
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1"
            disabled={busy}
            onClick={(event) => {
              const form = event.currentTarget.closest("form");
              if (!form) return;
              setBusy(true);
              form.requestSubmit();
            }}
          >
            Potvrdit
          </button>
        </span>
      )}
    </span>
  );
}
