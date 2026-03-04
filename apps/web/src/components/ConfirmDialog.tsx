'use client';

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
  if (!open) {
    return null;
  }

  return (
    <div className="dialogBackdrop" role="presentation" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="dialogCard"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="dialogTitle">
          {title}
        </h2>
        <p className="dialogMessage">{message}</p>
        <div className="dialogActions">
          <button type="button" className="secondaryButton" onClick={onCancel}>
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
