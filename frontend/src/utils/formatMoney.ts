export function formatVnd(amount: number): string {
    return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`
}
