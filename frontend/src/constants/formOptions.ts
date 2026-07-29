export const STYLE_OPTIONS = [
    "Hiện đại",
    "Tối giản",
    "Cổ điển",
    "Industrial",
    "Scandinavian",
    "Luxury",
    "Rustic",
] as const;

export const MATERIAL_OPTIONS = [
    "Gỗ sồi",
    "Gỗ óc chó",
    "Gỗ công nghiệp",
    "Nhựa",
    "Kim loại",
    "Kính",
    "Mây / tre",
    "Đá / marble",
] as const;

export const SHAPE_OPTIONS = [
    "Tròn",
    "Vuông",
    "Chữ nhật",
    "Oval",
    "Lục giác",
] as const;

export const SIZE_OPTIONS = [
    "Nhỏ",
    "Vừa",
    "Lớn",
    "120×80 cm",
    "160×90 cm",
    "180×100 cm",
    "200×100 cm",
] as const;

export const COLOR_OPTIONS = [
    "Đen",
    "Nâu",
    "Trắng",
    "Kem",
    "Xám",
    "Be",
    "Xanh olive",
] as const;

export const QUANTITY_OPTIONS = ["1", "2", "3", "4", "6", "8", "10", "12"] as const;

export const ACCESSORY_TYPE_OPTIONS = [
    "Bộ muỗng nĩa",
    "Bộ đĩa sứ",
    "Khăn trải bàn",
    "Lọ hoa / trang trí",
    "Khay",
    "Đèn bàn",
    "Ly / cốc",
] as const;

export function withCurrent(
    options: readonly string[],
    current?: string | null,
): string[] {
    const value = current?.trim();
    if (!value) return [...options];
    if (options.includes(value)) return [...options];
    return [value, ...options];
}
