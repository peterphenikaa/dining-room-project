type ConfirmDialogProps = {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** default danger — dùng primary cho hành động không phá hủy */
    confirmTone?: "danger" | "primary";
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    open,
    title = "Xác nhận",
    message,
    confirmLabel = "Xóa",
    cancelLabel = "Hủy",
    confirmTone = "danger",
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="modal-backdrop" role="presentation" onClick={onCancel}>
            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-title">{title}</h2>
                <p className="muted">{message}</p>
                <div className="actions">
                    <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={confirmTone === "primary" ? undefined : "danger"}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? "Đang xử lý..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
