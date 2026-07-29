type Props = {
    onEdit: () => void;
    onDelete: () => void;
};

export function RowActions({ onEdit, onDelete }: Props) {
    return (
        <td className="col-actions">
            <div className="row-actions">
                <button type="button" className="secondary" onClick={onEdit}>
                    Sửa
                </button>
                <button type="button" className="danger" onClick={onDelete}>
                    Xóa
                </button>
            </div>
        </td>
    );
}
