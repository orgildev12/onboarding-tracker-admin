import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';

export interface ISearchableSelectOption<T extends string | number> {
  value: T;
  label: string;
}

export interface ISearchableSelectProps<T extends string | number> {
  value: T;
  options: ISearchableSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  // extra classes for the text input, e.g. to make it taller/wider than the default
  inputClassName?: string;
}

// A text input that filters a long option list as the user types, for <select>s with too many options to scan.
export default function SearchableSelect<T extends string | number>(
  { value, options, onChange, placeholder, disabled, inputClassName }: ISearchableSelectProps<T>
): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlight, setHighlight] = React.useState(0);

  const selected = options.filter(option => option.value === value)[0];
  const filtered = query.trim()
    ? options.filter(option => option.label.toLowerCase().indexOf(query.trim().toLowerCase()) !== -1)
    : options;

  const select = (option: ISearchableSelectOption<T>): void => {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight(current => Math.min(current + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight(current => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && filtered[highlight]) {
        event.preventDefault();
        select(filtered[highlight]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className={styles.comboBox}>
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : (selected ? selected.label : '')}
        onFocus={() => { setOpen(true); setQuery(''); setHighlight(0); }}
        onBlur={() => setOpen(false)}
        onChange={event => { setQuery(event.target.value); setOpen(true); setHighlight(0); }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={inputClassName}
      />
      {open && (
        <ul className={styles.comboBoxList} role="listbox">
          {filtered.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`${styles.comboBoxOption} ${index === highlight ? styles.comboBoxOptionActive : ''}`}
              // keep focus on the input so the click isn't lost to a blur that closes the list first
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => select(option)}
            >
              {option.label}
            </li>
          ))}
          {filtered.length === 0 && <li className={styles.comboBoxEmpty}>Илэрц олдсонгүй</li>}
        </ul>
      )}
    </div>
  );
}
