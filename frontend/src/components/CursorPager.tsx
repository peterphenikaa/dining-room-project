type Props = {
    pageIndex: number;
    canPrev: boolean;
    canNext: boolean;
    busy?: boolean;
    onPrev: () => void;
    onNext: () => void;
};

export function CursorPager({ pageIndex, canPrev, canNext, busy, onPrev, onNext }: Props) {
    if (!canPrev && !canNext) return null;

    return (
        <div className="pager">
            <button type="button" className="secondary" disabled={!canPrev || busy} onClick={onPrev}>
                ← Trước
            </button>
            <span className="pager-label">Trang {pageIndex + 1}</span>
            <button type="button" className="secondary" disabled={!canNext || busy} onClick={onNext}>
                Sau →
            </button>
        </div>
    );
}
