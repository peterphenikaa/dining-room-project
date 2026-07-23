import { type FormEvent, useEffect, useState } from "react";
import * as cabinetsApi from "../api/cabinets";
import * as roomsApi from "../api/rooms";
import type { DiningCabinet, DiningRoom } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { getApiErrorMessage } from "../utils/apiError";

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [cabinets, roomList] = await Promise.all([
                cabinetsApi.fetchCabinets(),
                roomsApi.fetchRooms(),
            ]);
            setItems(cabinets);
            setRooms(roomList);
            setForm((prev) => ({
                ...prev,
                diningRoomId: prev.diningRoomId || roomList[0]?.id || "",
            }));
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được tủ"));
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
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!canWrite || !confirm("Xóa tủ này?")) return;
        try {
            await cabinetsApi.deleteCabinet(id);
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
                                        <td colSpan={canWrite ? 5 : 4}>Chưa có dữ liệu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
        </div>
    );
}
