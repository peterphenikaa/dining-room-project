import { type FormEvent, useEffect, useState } from "react";
import * as roomsApi from "../api/rooms";
import type { DiningRoom } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { getApiErrorMessage } from "../utils/apiError";

const emptyForm = { name: "", area_size: "20", style: "" };

export function RoomsPage() {
    const canWrite = useCanWrite();
    const [items, setItems] = useState<DiningRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            setItems(await roomsApi.fetchRooms());
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phòng ăn"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
    }

    function startEdit(room: DiningRoom) {
        setEditingId(room.id);
        setForm({
            name: room.name,
            area_size: String(room.area_size),
            style: room.style || "",
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
                area_size: Number(form.area_size),
                style: form.style.trim() || undefined,
            };
            if (editingId) await roomsApi.updateRoom(editingId, body);
            else await roomsApi.createRoom(body);
            setForm(emptyForm);
            setEditingId(null);
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!canWrite || !confirm("Xóa phòng ăn này? (cascade bàn/tủ)")) return;
        setError(null);
        try {
            await roomsApi.deleteRoom(id);
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
                    <h1>Phòng ăn</h1>
                    <p className="muted">/api/rooms</p>
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
                                    <th>Diện tích</th>
                                    <th>Style</th>
                                    {canWrite && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((room) => (
                                    <tr key={room.id}>
                                        <td>{room.name}</td>
                                        <td>{room.area_size}</td>
                                        <td>{room.style || "—"}</td>
                                        {canWrite && (
                                            <td className="row-actions">
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={() => startEdit(room)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => handleDelete(room.id)}
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={canWrite ? 4 : 3}>Chưa có dữ liệu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {canWrite && (
                    <section className="panel-box">
                        <h2>{editingId ? "Sửa phòng" : "Tạo phòng"}</h2>
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
                                Diện tích
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={form.area_size}
                                    onChange={(e) => setForm({ ...form, area_size: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                Style
                                <input
                                    value={form.style}
                                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                                />
                            </label>
                            <div className="actions">
                                <button type="submit" disabled={saving}>
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
