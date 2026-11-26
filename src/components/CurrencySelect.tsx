import { ALL_CURRENCIES, COMMON_CURRENCIES, currencyName } from '../currencies';

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  id?: string;
  /** Show just the code (e.g. "JPY") when closed; the open list still has full names. */
  compact?: boolean;
};

export default function CurrencySelect({ value, onChange, disabled, id, compact }: Props) {
  const common = COMMON_CURRENCIES.filter((c) => ALL_CURRENCIES.includes(c));
  const select = (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      title={currencyName(value)}
      className={compact ? 'compact-select' : undefined}
    >
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
  if (!compact) return select;
  return (
    <span className="compact-wrap">
      {select}
      <span className="compact-label" aria-hidden>
        {value}
      </span>
    </span>
  );
}
