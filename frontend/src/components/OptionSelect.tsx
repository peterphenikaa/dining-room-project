import { withCurrent } from "../constants/formOptions";

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: readonly string[];
    required?: boolean;
    allowEmpty?: boolean;
    emptyLabel?: string;
};

export function OptionSelect({
    label,
    value,
    onChange,
    options,
    required,
    allowEmpty = true,
    emptyLabel = "— chọn —",
}: Props) {
    const opts = withCurrent(options, value);

    return (
        <label>
            {label}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
            >
                {allowEmpty && <option value="">{emptyLabel}</option>}
                {opts.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </label>
    );
}
