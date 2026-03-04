'use client';

import { useEffect, useId } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialogBackdrop" role="presentation" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="dialogCard"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="dialogTitle">
          {title}
        </h2>
        <p id={descriptionId} className="dialogMessage">
          {message}
        </p>
        <div className="dialogActions">
          <button type="button" className="secondaryButton" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button
            type="button"
            className={destructive ? 'dangerButton' : 'primaryButton'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
