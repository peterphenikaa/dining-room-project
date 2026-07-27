type Props = {
    thumbUrl?: string | null;
    url?: string | null;
    alt: string;
};

export function EntityThumb({ thumbUrl, url, alt }: Props) {
    const src = thumbUrl || url;
    if (!src) return <span className="muted">—</span>;
    return <img src={src} alt={alt} className="row-thumb" />;
}
