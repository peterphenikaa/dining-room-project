import { type FormEvent, useEffect, useState } from "react";
import * as chairsApi from "../api/chairs";
import * as tablesApi from "../api/tables";
import type { DiningChair, DiningTable } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { getApiErrorMessage } from "../utils/apiError";

const emptyForm = {
    name: "",
    material: "",
    color: "",
    quantity: "1",
    diningTableId: "",
};

export function ChairsPage() {
    const canWrite = useCanWrite();
    const [items, setItems] = useState<DiningChair[]>([]);
    const [tables, setTables] = useState<DiningTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [chairs, tableList] = await Promise.all([
                chairsApi.fetchChairs(),
                tablesApi.fetchTables(),
            ]);
            setItems(chairs);
            setTables(tableList);
            setForm((prev) => ({
                ...prev,
                diningTableId: prev.diningTableId || tableList[0]?.id || "",
            }));
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được ghế"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    function startCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, diningTableId: tables[0]?.id || "" });
    }

    function startEdit(row: DiningChair) {
        setEditingId(row.id);
        setForm({
            name: row.name,
            material: row.material,
            color: row.color || "",
            quantity: String(row.quantity ?? 1),
            diningTableId: row.diningTable?.id || "",
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
                color: form.color.trim() || undefined,
                quantity: Number(form.quantity),
                diningTableId: form.diningTableId,
            };
            if (editingId) await chairsApi.updateChair(editingId, body);
            else await chairsApi.createChair(body);
            startCreate();
            await load();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!canWrite || !confirm("Xóa ghế này?")) return;
        try {
            await chairsApi.deleteChair(id);
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
                    <h1>Ghế ăn</h1>
                    <p className="muted">/api/chairs — có quantity</p>
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
                                    <th>Màu</th>
                                    <th>SL</th>
                                    <th>Bàn</th>
                                    {canWrite && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.name}</td>
                                        <td>{row.material}</td>
                                        <td>{row.color || "—"}</td>
                                        <td>{row.quantity}</td>
                                        <td>{row.diningTable?.name || "—"}</td>
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
                        <h2>{editingId ? "Sửa ghế" : "Tạo ghế"}</h2>
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
                                Màu
                                <input
                                    value={form.color}
                                    onChange={(e) => setForm({ ...form, color: e.target.value })}
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
                                Bàn ăn
                                <select
                                    value={form.diningTableId}
                                    onChange={(e) => setForm({ ...form, diningTableId: e.target.value })}
                                    required
                                >
                                    <option value="">— chọn —</option>
                                    {tables.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="actions">
                                <button type="submit" disabled={saving || !tables.length}>
                                    {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                                </button>
                                {editingId && (
                                    <button type="button" className="secondary" onClick={startCreate}>
                                        Hủy
                                    </button>
                                )}
                            </div>
                            {!tables.length && <p className="hint">Cần tạo ít nhất 1 bàn trước.</p>}
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
}
