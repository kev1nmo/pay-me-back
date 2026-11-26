import { ALL_CURRENCIES, COMMON_CURRENCIES, currencyName } from '../currencies';

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  id?: string;
};

export default function CurrencySelect({ value, onChange, disabled, id }: Props) {
  const common = COMMON_CURRENCIES.filter((c) => ALL_CURRENCIES.includes(c));
  return (
    <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <optgroup label="Common">
        {common.map((c) => (
          <option key={c} value={c}>
            {c} — {currencyName(c)}
          </option>
        ))}
      </optgroup>
      <optgroup label="All currencies">
        {ALL_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c} — {currencyName(c)}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
