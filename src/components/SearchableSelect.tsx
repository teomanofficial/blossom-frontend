import Select, { StylesConfig, GroupBase } from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  className?: string;
}

const glassStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    background: state.isFocused ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.04)',
    border: `1px solid ${state.isFocused ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '0.75rem',
    minHeight: 'unset',
    padding: '0',
    boxShadow: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '4px 12px',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    margin: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    margin: 0,
  }),
  input: (base) => ({
    ...base,
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.4)',
    padding: '0 4px',
    cursor: 'pointer',
    '&:hover': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    svg: {
      width: '12px',
      height: '12px',
    },
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: 'rgba(255, 255, 255, 0.4)',
    padding: '4px 8px',
    transition: 'transform 0.2s ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    '&:hover': {
      color: 'rgba(255, 255, 255, 0.6)',
    },
    svg: {
      width: '14px',
      height: '14px',
    },
  }),
  menu: (base) => ({
    ...base,
    background: 'rgba(15, 15, 25, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    zIndex: 50,
    marginTop: '4px',
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
    maxHeight: '240px',
    '::-webkit-scrollbar': {
      width: '4px',
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
    },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '10px',
    fontWeight: 700,
    padding: '8px 12px',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    color: state.isSelected ? '#fff' : state.isFocused ? '#fff' : 'rgba(255, 255, 255, 0.7)',
    background: state.isSelected
      ? 'rgba(244, 114, 182, 0.25)'
      : state.isFocused
        ? 'rgba(255, 255, 255, 0.08)'
        : 'transparent',
    '&:active': {
      background: 'rgba(244, 114, 182, 0.3)',
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.4)',
  }),
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isSearchable = true,
  className,
}: SearchableSelectProps) {
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Select<SelectOption, false>
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : '')}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isClearable={!!value}
      styles={glassStyles}
      className={className}
      classNamePrefix="glass-select"
      unstyled={false}
    />
  );
}
