export function resolveApiUrl(): string {
    const configured = import.meta.env.VITE_API_URL as string | undefined;
    if (configured !== undefined && configured !== "") return configured;
    return "";
}
