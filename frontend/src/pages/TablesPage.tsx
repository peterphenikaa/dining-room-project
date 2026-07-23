import { type FormEvent, useEffect, useState } from "react";
import * as tablesApi from "../api/tables";
import * as roomsApi from "../api/rooms";
import type { DiningRoom, DiningTable } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { getApiErrorMessage } from "../utils/apiError";

const emptyForm = {
    name: "",
    material: "",
    shape: "",
    dimensions: "",
    quantity: "1",
    diningRoomId: "",
};

export function TablesPage() {
    const canWrite = useCanWrite();
    const [items, setItems] = useState<DiningTable[]>([]);
    const [rooms, setRooms] = useState<DiningRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [tables, roomList] = await Promise.all([
                tablesApi.fetchTables(),
                roomsApi.fetchRooms(),
            ]);
            setItems(tables);
            setRooms(roomList);
            setForm((prev) => ({
                ...prev,
                diningRoomId: prev.diningRoomId || roomList[0]?.id || "",
            }));
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được bàn ăn"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    function startCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, diningRoomId: rooms[0]?.id || "" });
    }

    function startEdit(row: DiningTable) {
        setEditingId(row.id);
        setForm({
            name: row.name,
            material: row.material,
            shape: row.shape,
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
                shape: form.shape.trim(),
                dimensions: form.dimensions.trim() || undefined,
                quantity: Number(form.quantity),
                diningRoomId: form.diningRoomId,
            };
            if (editingId) await tablesApi.updateTable(editingId, body);
            else await tablesApi.createTable(body);
            startCreate();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!canWrite || !confirm("Xóa bàn này? (cascade ghế/phụ kiện)")) return;
        try {
            await tablesApi.deleteTable(id);
            if (editingId === id) startCreate();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    }

    return (
        <div className="page">
            <header className="page-header">
                <div>
                    <h1>Bàn ăn</h1>
                    <p className="muted">/api/tables — có quantity</p>
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
                                    <th>Hình</th>
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
                                        <td>{row.shape}</td>
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
                                                    onClick={() => handleDelete(row.id)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={canWrite ? 6 : 5}>Chưa có dữ liệu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {canWrite && (
                    <section className="panel-box">
                        <h2>{editingId ? "Sửa bàn" : "Tạo bàn"}</h2>
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
                                Hình dạng
                                <input
                                    value={form.shape}
                                    onChange={(e) => setForm({ ...form, shape: e.target.value })}
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
                            {!rooms.length && (
                                <p className="hint">Cần tạo ít nhất 1 phòng ăn trước.</p>
                            )}
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
}
