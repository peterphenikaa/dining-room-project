import { type FormEvent, useEffect, useState } from "react";
import * as cabinetsApi from "../api/cabinets";
import * as roomsApi from "../api/rooms";
import { OPTIONS_LIMIT, PAGE_LIMIT } from "../api/listParams";
import type { DiningCabinet, DiningRoom } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { getApiErrorMessage } from "../utils/apiError";
import { ConfirmDialog } from "../components/ConfirmDialog";

const emptyForm = {
    name: "",
    material: "",
    dimensions: "",
    quantity: "1",
    diningRoomId: "",
};

export function CabinetsPage() {
    const canWrite = useCanWrite();
    const [items, setItems] = useState<DiningCabinet[]>([]);
    const [rooms, setRooms] = useState<DiningRoom[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function load(reset = true) {
        if (!reset && !nextCursor) return;
        if (reset) {
            setLoading(true);
            setError(null);
        } else {
            setLoadingMore(true);
        }
        try {
            if (reset) {
                const [cabinetsPage, roomsPage] = await Promise.all([
                    cabinetsApi.fetchCabinets({ limit: PAGE_LIMIT }),
                    roomsApi.fetchRooms({ limit: OPTIONS_LIMIT }),
                ]);
                setItems(cabinetsPage.items);
                setNextCursor(cabinetsPage.nextCursor);
                setHasMore(cabinetsPage.hasMore);
                setRooms(roomsPage.items);
                setForm((prev) => ({
                    ...prev,
                    diningRoomId: prev.diningRoomId || roomsPage.items[0]?.id || "",
                }));
            } else {
                const cabinetsPage = await cabinetsApi.fetchCabinets({
                    cursor: nextCursor,
                    limit: PAGE_LIMIT,
                });
                setItems((prev) => [...prev, ...cabinetsPage.items]);
                setNextCursor(cabinetsPage.nextCursor);
                setHasMore(cabinetsPage.hasMore);
            }
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được tủ"));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    useEffect(() => {
        void load(true);
    }, []);

    function startCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, diningRoomId: rooms[0]?.id || "" });
    }

    function startEdit(row: DiningCabinet) {
        setEditingId(row.id);
        setForm({
            name: row.name,
            material: row.material,
            dimensions: row.dimensions || "",
            quantity: String(row.quantity ?? 1),
            diningRoomId: row.diningRoom?.id || "",
        });
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canWrite) return;
        setSaving(true);
        setError(null);
        try {
            const body = {
                name: form.name.trim(),
                material: form.material.trim(),
                dimensions: form.dimensions.trim() || undefined,
                quantity: Number(form.quantity),
                diningRoomId: form.diningRoomId,
            };
            if (editingId) await cabinetsApi.updateCabinet(editingId, body);
            else await cabinetsApi.createCabinet(body);
            startCreate();
            await load(true);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!canWrite || !pendingDeleteId) return;
        setDeleting(true);
        setError(null);
        try {
            await cabinetsApi.deleteCabinet(pendingDeleteId);
            if (editingId === pendingDeleteId) startCreate();
            setPendingDeleteId(null);
            await load(true);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Tủ phòng ăn</h1>
                </div>
                {canWrite && (
                    <button type="button" className="secondary" onClick={startCreate}>
                        Form tạo mới
                    </button>
                )}
            </header>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Đang tải...</p>}

            <div className="crud-grid">
                <section className="panel-box">
                    <h2>Danh sách ({items.length})</h2>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Chất liệu</th>
                                    <th>SL</th>
                                    <th>Phòng</th>
                                    {canWrite && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.name}</td>
                                        <td>{row.material}</td>
                                        <td>{row.quantity}</td>
                                        <td>{row.diningRoom?.name || "—"}</td>
                                        {canWrite && (
                                            <td className="row-actions">
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={() => startEdit(row)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => setPendingDeleteId(row.id)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={canWrite ? 5 : 4}>Chưa có dữ liệu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {hasMore && (
                        <div className="load-more">
                            <button
                                type="button"
                                className="secondary"
                                disabled={loadingMore}
                                onClick={() => void load(false)}
                            >
                                {loadingMore ? "Đang tải..." : "Tải thêm"}
                            </button>
                        </div>
                    )}
                </section>

                {canWrite && (
                    <section className="panel-box">
                        <h2>{editingId ? "Sửa tủ" : "Tạo tủ"}</h2>
                        <form className="form" onSubmit={handleSubmit}>
                            <label>
                                Tên
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Chất liệu
                                <input
                                    value={form.material}
                                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Kích thước
                                <input
                                    value={form.dimensions}
                                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                                />
                            </label>
                            <label>
                                Số lượng
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={form.quantity}
                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Phòng ăn
                                <select
                                    value={form.diningRoomId}
                                    onChange={(e) => setForm({ ...form, diningRoomId: e.target.value })}
                                    required
                                >
                                    <option value="">— chọn —</option>
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="actions">
                                <button type="submit" disabled={saving || !rooms.length}>
                                    {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                                </button>
                                {editingId && (
                                    <button type="button" className="secondary" onClick={startCreate}>
                                        Hủy
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                )}
            </div>

            <ConfirmDialog
                open={!!pendingDeleteId}
                title="Xóa tủ"
                message="Bạn có chắc muốn xóa tủ này?"
                busy={deleting}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={() => void handleDelete()}
            />
        </div>
    );
}
