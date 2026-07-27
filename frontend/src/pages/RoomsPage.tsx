import { type FormEvent, useEffect, useState } from "react";
import * as roomsApi from "../api/rooms";
import { deleteEntityImage, uploadEntityImage } from "../api/entityImages";
import { PAGE_LIMIT } from "../api/listParams";
import type { DiningRoom } from "../types/api";
import { useCanWrite } from "../hooks/useCanWrite";
import { useReloadOnDiningChange } from "../hooks/useReloadOnDiningChange";
import { getApiErrorMessage } from "../utils/apiError";
import { applyCursorPage } from "../utils/cursorPage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CursorPager } from "../components/CursorPager";
import { EntityImageField } from "../components/EntityImageField";
import { EntityThumb } from "../components/EntityThumb";

const emptyForm = { name: "", area_size: "20", style: "" };

export function RoomsPage() {
    const canWrite = useCanWrite();
    const [items, setItems] = useState<DiningRoom[]>([]);
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
            const page = await roomsApi.fetchRooms({ limit: PAGE_LIMIT });
            setPageCursors([undefined]);
            applyCursorPage(page, 0, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phòng ăn"));
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
            const page = await roomsApi.fetchRooms({ cursor, limit: PAGE_LIMIT });
            applyCursorPage(page, pageIndex + 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phòng ăn"));
        } finally {
            setPaging(false);
        }
    }

    async function goPrev() {
        if (pageIndex <= 0) return;
        setPaging(true);
        setError(null);
        try {
            const page = await roomsApi.fetchRooms({
                cursor: pageCursors[pageIndex - 1],
                limit: PAGE_LIMIT,
            });
            applyCursorPage(page, pageIndex - 1, setItems, setHasMore, setPageIndex, setPageCursors);
        } catch (e) {
            setError(getApiErrorMessage(e, "Không tải được phòng ăn"));
        } finally {
            setPaging(false);
        }
    }

    useEffect(() => {
        void loadFirst();
    }, []);

    useReloadOnDiningChange("room", loadFirst);

    function clearImageField() {
        setImageFile(null);
        setEditingImage({});
        setImageResetKey((k) => k + 1);
    }

    function startCreate() {
        setEditingId(null);
        setForm(emptyForm);
        clearImageField();
    }

    function startEdit(room: DiningRoom) {
        setEditingId(room.id);
        setForm({
            name: room.name,
            area_size: String(room.area_size),
            style: room.style || "",
        });
        setImageFile(null);
        setEditingImage({ url: room.imageUrl, thumb: room.imageThumbUrl });
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
                area_size: Number(form.area_size),
                style: form.style.trim() || undefined,
            };
            const saved = editingId
                ? await roomsApi.updateRoom(editingId, body)
                : await roomsApi.createRoom(body);
            if (imageFile) {
                await uploadEntityImage<DiningRoom>("rooms", saved.id, imageFile);
            }
            setForm(emptyForm);
            setEditingId(null);
            clearImageField();
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
            const updated = await deleteEntityImage<DiningRoom>("rooms", editingId);
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
            await roomsApi.deleteRoom(pendingDeleteId);
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
                    <h1>Phòng ăn</h1>
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
                                    <th>Diện tích</th>
                                    <th>Style</th>
                                    {canWrite && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((room) => (
                                    <tr key={room.id}>
                                        <td>
                                            <EntityThumb
                                                thumbUrl={room.imageThumbUrl}
                                                url={room.imageUrl}
                                                alt={room.name}
                                            />
                                        </td>
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
                                                    onClick={() => setPendingDeleteId(room.id)}
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
                            <EntityImageField
                                resetKey={imageResetKey}
                                previewUrl={editingImage.thumb || editingImage.url}
                                onFileChange={setImageFile}
                                onRemoveExisting={editingId ? () => void handleRemoveImage() : undefined}
                                removing={removingImage}
                            />
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

            <ConfirmDialog
                open={!!pendingDeleteId}
                title="Xóa phòng ăn"
                message="Xóa phòng này sẽ xóa luôn bàn và tủ bên trong. Tiếp tục?"
                busy={deleting}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={() => void handleDelete()}
            />
        </div>
    );
}
