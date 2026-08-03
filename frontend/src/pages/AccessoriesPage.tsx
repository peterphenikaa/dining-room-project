import { type FormEvent, useEffect, useState } from "react";
import * as accessoriesApi from "../api/accessories";
import * as tablesApi from "../api/tables";
import { deleteEntityImage, uploadEntityImage } from "../api/entityImages";
import { OPTIONS_LIMIT, PAGE_LIMIT } from "../api/listParams";
import { AddToCartButton } from "../components/AddToCartButton";
import { OptionSelect } from "../components/OptionSelect";
import { RowActions } from "../components/RowActions";
import {
    ACCESSORY_TYPE_OPTIONS,
    QUANTITY_OPTIONS,
} from "../constants/formOptions";
import type { DiningAccessory, DiningTable } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { useReloadOnDiningChange } from "../hooks/useReloadOnDiningChange";
import { getApiErrorMessage } from "../utils/apiError";
import { formatVnd } from "../utils/formatMoney";
import { applyCursorPage } from "../utils/cursorPage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CursorPager } from "../components/CursorPager";
import { EntityImageField } from "../components/EntityImageField";
import { EntityThumb } from "../components/EntityThumb";

const emptyForm = {
    name: "",
    type: "",
    quantity: "1",
    price: "0",
    diningTableId: "",
};

export function AccessoriesPage() {
    const canWrite = useCanWrite();
    const [items, setItems] = useState<DiningAccessory[]>([]);
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
            const [accessoriesPage, tablesPage] = await Promise.all([
                accessoriesApi.fetchAccessories({ limit: PAGE_LIMIT }),
                tablesApi.fetchTables({ limit: OPTIONS_LIMIT }),
            ]);
            setPageCursors([undefined]);
            applyCursorPage(accessoriesPage, 0, setItems, setHasMore, setPageIndex, setPageCursors);
            setTables(tablesPage.items);
            setForm((prev) => ({
                ...prev,
                diningTableId: prev.diningTableId || tablesPage.items[0]?.id || "",
            }));
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phụ kiện"));
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
            const page = await accessoriesApi.fetchAccessories({ cursor, limit: PAGE_LIMIT });
            applyCursorPage(page, pageIndex + 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phụ kiện"));
        } finally {
            setPaging(false);
        }
    }

    async function goPrev() {
        if (pageIndex <= 0) return;
        setPaging(true);
        setError(null);
        try {
            const page = await accessoriesApi.fetchAccessories({
                cursor: pageCursors[pageIndex - 1],
                limit: PAGE_LIMIT,
            });
            applyCursorPage(page, pageIndex - 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phụ kiện"));
        } finally {
            setPaging(false);
        }
    }

    useEffect(() => {
        void loadFirst();
    }, []);

    useReloadOnDiningChange("accessory", loadFirst);

    function startCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, diningTableId: tables[0]?.id || "" });
        setImageFile(null);
        setEditingImage({});
        setImageResetKey((k) => k + 1);
    }

    function startEdit(row: DiningAccessory) {
        setEditingId(row.id);
        setForm({
            name: row.name,
            type: row.type,
            quantity: String(row.quantity ?? 1),
            price: String(row.price ?? 0),
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
                type: form.type.trim(),
                quantity: Number(form.quantity),
                price: Number(form.price),
                diningTableId: form.diningTableId,
            };
            const saved = editingId
                ? await accessoriesApi.updateAccessory(editingId, body)
                : await accessoriesApi.createAccessory(body);
            if (imageFile) {
                await uploadEntityImage<DiningAccessory>("accessories", saved.id, imageFile);
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
            const updated = await deleteEntityImage<DiningAccessory>("accessories", editingId);
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
            await accessoriesApi.deleteAccessory(pendingDeleteId);
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
                    <h1>Phụ kiện bàn ăn</h1>
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
                                    <th>Loại</th>
                                    <th>SL</th>
                                    <th>Giá</th>
                                    <th>Bàn</th>
                                    <th></th>
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
                                        <td>{row.type}</td>
                                        <td>{row.quantity}</td>
                                        <td>{formatVnd(row.price ?? 0)}</td>
                                        <td>{row.diningTable?.name || "—"}</td>
                                        <td>
                                            <div className="row-actions-inline">
                                                <AddToCartButton
                                                    productType="accessory"
                                                    productId={row.id}
                                                    disabled={(row.price ?? 0) <= 0 || row.quantity <= 0}
                                                />
                                                {canWrite && (
                                                    <RowActions
                                                        onEdit={() => startEdit(row)}
                                                        onDelete={() => setPendingDeleteId(row.id)}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && items.length === 0 && (
                                    <tr>
                                        <td colSpan={7}>Chưa có dữ liệu</td>
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
                        <h2>{editingId ? "Sửa phụ kiện" : "Tạo phụ kiện"}</h2>
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
                                label="Loại"
                                value={form.type}
                                onChange={(type) => setForm({ ...form, type })}
                                options={ACCESSORY_TYPE_OPTIONS}
                                required
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
                                Giá (VND)
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
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
                        </form>
                    </section>
                )}
            </div>

            <ConfirmDialog
                open={!!pendingDeleteId}
                title="Xóa phụ kiện"
                message="Bạn có chắc muốn xóa phụ kiện này?"
                busy={deleting}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={() => void handleDelete()}
            />
        </div>
    );
}
