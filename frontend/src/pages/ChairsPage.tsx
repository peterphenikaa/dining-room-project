import { type FormEvent, useEffect, useState } from "react";
import * as chairsApi from "../api/chairs";
import * as tablesApi from "../api/tables";
import { deleteEntityImage, uploadEntityImage } from "../api/entityImages";
import { OPTIONS_LIMIT, PAGE_LIMIT } from "../api/listParams";
import { OptionSelect } from "../components/OptionSelect";
import { RowActions } from "../components/RowActions";
import {
    COLOR_OPTIONS,
    MATERIAL_OPTIONS,
    QUANTITY_OPTIONS,
} from "../constants/formOptions";
import type { DiningChair, DiningTable } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { useReloadOnDiningChange } from "../hooks/useReloadOnDiningChange";
import { getApiErrorMessage } from "../utils/apiError";
import { applyCursorPage } from "../utils/cursorPage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CursorPager } from "../components/CursorPager";
import { EntityImageField } from "../components/EntityImageField";
import { EntityThumb } from "../components/EntityThumb";

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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingImage, setEditingImage] = useState<{ url?: string | null; thumb?: string | null }>({});
    const [removingImage, setRemovingImage] = useState(false);
    const [imageResetKey, setImageResetKey] = useState(0);

    async function loadFirst() {
        setLoading(true);
        setError(null);
        try {
            const [chairsPage, tablesPage] = await Promise.all([
                chairsApi.fetchChairs({ limit: PAGE_LIMIT }),
                tablesApi.fetchTables({ limit: OPTIONS_LIMIT }),
            ]);
            setPageCursors([undefined]);
            applyCursorPage(chairsPage, 0, setItems, setHasMore, setPageIndex, setPageCursors);
            setTables(tablesPage.items);
            setForm((prev) => ({
                ...prev,
                diningTableId: prev.diningTableId || tablesPage.items[0]?.id || "",
            }));
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được ghế"));
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
            const page = await chairsApi.fetchChairs({ cursor, limit: PAGE_LIMIT });
            applyCursorPage(page, pageIndex + 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được ghế"));
        } finally {
            setPaging(false);
        }
    }

    async function goPrev() {
        if (pageIndex <= 0) return;
        setPaging(true);
        setError(null);
        try {
            const page = await chairsApi.fetchChairs({
                cursor: pageCursors[pageIndex - 1],
                limit: PAGE_LIMIT,
            });
            applyCursorPage(page, pageIndex - 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được ghế"));
        } finally {
            setPaging(false);
        }
    }

    useEffect(() => {
        void loadFirst();
    }, []);

    useReloadOnDiningChange("chair", loadFirst);

    function startCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, diningTableId: tables[0]?.id || "" });
        setImageFile(null);
        setEditingImage({});
        setImageResetKey((k) => k + 1);
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
        setImageFile(null);
        setEditingImage({ url: row.imageUrl, thumb: row.imageThumbUrl });
        setImageResetKey((k) => k + 1);
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
            const saved = editingId
                ? await chairsApi.updateChair(editingId, body)
                : await chairsApi.createChair(body);
            if (imageFile) {
                await uploadEntityImage<DiningChair>("chairs", saved.id, imageFile);
            }
            startCreate();
            await loadFirst();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleRemoveImage() {
        if (!canWrite || !editingId) return;
        setRemovingImage(true);
        setError(null);
        try {
            const updated = await deleteEntityImage<DiningChair>("chairs", editingId);
            setEditingImage({ url: updated.imageUrl, thumb: updated.imageThumbUrl });
            setImageFile(null);
            await loadFirst();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setRemovingImage(false);
        }
    }

    async function handleDelete() {
        if (!canWrite || !pendingDeleteId) return;
        setDeleting(true);
        setError(null);
        try {
            await chairsApi.deleteChair(pendingDeleteId);
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
                    <h1>Ghế ăn</h1>
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
                                    <th>Ảnh</th>
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
                                        <td>
                                            <EntityThumb
                                                thumbUrl={row.imageThumbUrl}
                                                url={row.imageUrl}
                                                alt={row.name}
                                            />
                                        </td>
                                        <td>{row.name}</td>
                                        <td>{row.material}</td>
                                        <td>{row.color || "—"}</td>
                                        <td>{row.quantity}</td>
                                        <td>{row.diningTable?.name || "—"}</td>
                                        {canWrite && (
                                            <RowActions
                                                onEdit={() => startEdit(row)}
                                                onDelete={() => setPendingDeleteId(row.id)}
                                            />
                                        )}
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={canWrite ? 7 : 6}>Chưa có dữ liệu</td>
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
                            <OptionSelect
                                label="Chất liệu"
                                value={form.material}
                                onChange={(material) => setForm({ ...form, material })}
                                options={MATERIAL_OPTIONS}
                                required
                            />
                            <OptionSelect
                                label="Màu"
                                value={form.color}
                                onChange={(color) => setForm({ ...form, color })}
                                options={COLOR_OPTIONS}
                            />
                            <OptionSelect
                                label="Số lượng"
                                value={form.quantity}
                                onChange={(quantity) => setForm({ ...form, quantity })}
                                options={QUANTITY_OPTIONS}
                                required
                                allowEmpty={false}
                            />
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
                            <EntityImageField
                                resetKey={imageResetKey}
                                previewUrl={editingImage.thumb || editingImage.url}
                                onFileChange={setImageFile}
                                onRemoveExisting={editingId ? () => void handleRemoveImage() : undefined}
                                removing={removingImage}
                            />
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

            <ConfirmDialog
                open={!!pendingDeleteId}
                title="Xóa ghế"
                message="Bạn có chắc muốn xóa ghế này?"
                busy={deleting}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={() => void handleDelete()}
            />
        </div>
    );
}
