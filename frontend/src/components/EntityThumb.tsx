type Props = {
    thumbUrl?: string | null;
    url?: string | null;
    alt: string;
};

export function EntityThumb({ thumbUrl, url, alt }: Props) {
    const src = thumbUrl || url;
    return (
        <span className="cell-thumb">
            {src ? (
                <img src={src} alt={alt} className="row-thumb" />
            ) : (
                <span className="cell-thumb-empty" aria-hidden>
                    —
                </span>
            )}
        </span>
    );
}
