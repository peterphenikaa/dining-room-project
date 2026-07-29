import { useEffect, useRef, useState, type ChangeEvent } from "react";

type Props = {
    resetKey?: number | string;
    previewUrl?: string | null;
    disabled?: boolean;
    onFileChange: (file: File | null) => void;
    onRemoveExisting?: () => void;
    removing?: boolean;
};

export function EntityImageField({
    resetKey = 0,
    previewUrl,
    disabled,
    onFileChange,
    onRemoveExisting,
    removing,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    useEffect(() => {
        setLocalPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (inputRef.current) inputRef.current.value = "";
    }, [resetKey]);

    useEffect(() => {
        return () => {
            if (localPreview) URL.revokeObjectURL(localPreview);
        };
    }, [localPreview]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setLocalPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : null;
        });
        onFileChange(file);
    }

    const shown = localPreview || previewUrl || null;

    return (
        <div className="image-field">
            <span className="image-field-label">Ảnh</span>
            {shown ? (
                <img src={shown} alt="Preview" className="thumb-preview" />
            ) : (
                <p className="muted">Chưa có ảnh</p>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={disabled}
                onChange={handleChange}
            />
            {previewUrl && onRemoveExisting && !localPreview && (
                <button
                    type="button"
                    className="danger"
                    disabled={disabled || removing}
                    onClick={onRemoveExisting}
                >
                    {removing ? "Đang xóa ảnh..." : "Xóa ảnh hiện tại"}
                </button>
            )}
        </div>
    );
}
