'use client';

import Select, { StylesConfig } from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  darkMode?: boolean;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  noOptionsMessage = 'No results',
  darkMode = false,
  disabled = false,
}: SearchableSelectProps) {
  const styles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      borderColor: darkMode ? '#374151' : '#d1d5db',
      borderRadius: '0.75rem',
      padding: '0.25rem',
      opacity: state.isDisabled ? 0.5 : 1,
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      '&:hover': { borderColor: state.isDisabled ? (darkMode ? '#374151' : '#d1d5db') : '#0ea5e9' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      borderRadius: '0.75rem',
      border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
      zIndex: 50,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? darkMode ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.1)'
        : 'transparent',
      color: state.data.value === 'new' ? '#0ea5e9' : darkMode ? '#f3f4f6' : '#111827',
      fontWeight: state.data.value === 'new' ? 600 : 400,
      cursor: 'pointer',
    }),
    singleValue: (base) => ({
      ...base,
      color: darkMode ? '#f3f4f6' : '#111827',
    }),
    input: (base) => ({
      ...base,
      color: darkMode ? '#f3f4f6' : '#111827',
    }),
    placeholder: (base) => ({
      ...base,
      color: darkMode ? '#9ca3af' : '#6b7280',
    }),
  };

  return (
    <Select<SelectOption>
      options={options}
      value={options.find(o => o.value === value) || null}
      onChange={(option) => onChange(option?.value || '')}
      placeholder={placeholder}
      isSearchable
      isDisabled={disabled}
      styles={styles}
      noOptionsMessage={() => noOptionsMessage}
    />
  );
}
