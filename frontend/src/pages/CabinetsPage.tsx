import { type FormEvent, useEffect, useState } from "react";
import * as cabinetsApi from "../api/cabinets";
import * as roomsApi from "../api/rooms";
import { OPTIONS_LIMIT, PAGE_LIMIT } from "../api/listParams";
import type { DiningCabinet, DiningRoom } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { useReloadOnDiningChange } from "../hooks/useReloadOnDiningChange";
import { getApiErrorMessage } from "../utils/apiError";
import { applyCursorPage } from "../utils/cursorPage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CursorPager } from "../components/CursorPager";

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
    const [pageIndex, setPageIndex] = useState(0);
    const [pageCursors, setPageCursors] = useState<(string | undefined)[]>([undefined]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paging, setPaging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function loadFirst() {
        setLoading(true);
        setError(null);
        try {
            const [cabinetsPage, roomsPage] = await Promise.all([
                cabinetsApi.fetchCabinets({ limit: PAGE_LIMIT }),
                roomsApi.fetchRooms({ limit: OPTIONS_LIMIT }),
            ]);
            setPageCursors([undefined]);
            applyCursorPage(cabinetsPage, 0, setItems, setHasMore, setPageIndex, setPageCursors);
            setRooms(roomsPage.items);
            setForm((prev) => ({
                ...prev,
                diningRoomId: prev.diningRoomId || roomsPage.items[0]?.id || "",
            }));
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được tủ"));
        } finally {
            setLoading(false);
        }
    }

    async function goNext() {
        const cursor = pageCursors[pageIndex + 1];
        if (!hasMore || !cursor) return;
        setPaging(true);
        setError(null);
        try {
            const page = await cabinetsApi.fetchCabinets({ cursor, limit: PAGE_LIMIT });
            applyCursorPage(page, pageIndex + 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được tủ"));
        } finally {
            setPaging(false);
        }
    }

    async function goPrev() {
        if (pageIndex <= 0) return;
        setPaging(true);
        setError(null);
        try {
            const page = await cabinetsApi.fetchCabinets({
                cursor: pageCursors[pageIndex - 1],
                limit: PAGE_LIMIT,
            });
            applyCursorPage(page, pageIndex - 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được tủ"));
        } finally {
            setPaging(false);
        }
    }

    useEffect(() => {
        void loadFirst();
    }, []);

    useReloadOnDiningChange("cabinet", loadFirst);

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
            await loadFirst();
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
            await loadFirst();
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
                    <h2>Danh sách ({items.length}/trang)</h2>
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
                    <CursorPager
                        pageIndex={pageIndex}
                        canPrev={pageIndex > 0}
                        canNext={hasMore}
                        busy={paging}
                        onPrev={() => void goPrev()}
                        onNext={() => void goNext()}
                    />
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
