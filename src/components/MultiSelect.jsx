import React, { useEffect, useId, useRef, useState } from 'react';

const chevron = <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/**
 * Select-styled dropdown with checkboxes. An empty value means "ทั้งหมด"; allLabel names that option in the list (e.g. ทุกสถานะ).
 * searchable turns the field into a text box: typing narrows the list (used for the long การไฟฟ้า list).
 */
export default function MultiSelect({ label, options, value, onChange, disabled = false, error, allLabel = 'ทั้งหมด', searchable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef(null);
  const id = useId();
  const close = () => { setOpen(false); setQuery(''); };
  useEffect(() => {
    if (!open) return undefined;
    const outside = event => { if (!root.current.contains(event.target)) close(); };
    const escape = event => { if (event.key === 'Escape') { close(); root.current.querySelector('button, input').focus(); } };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const all = value.length === 0;
  const summary = all ? 'ทั้งหมด' : value.length === 1 ? options.find(option => option.value === value[0])?.label ?? String(value[0]) : `เลือก ${value.length} รายการ`;
  const term = query.trim().toLowerCase();
  const shown = term ? options.filter(option => String(option.label).toLowerCase().includes(term)) : options;
  function toggle(optionValue) {
    const next = value.includes(optionValue) ? value.filter(item => item !== optionValue) : [...value, optionValue];
    // Ticking every option is the same as "ทั้งหมด".
    onChange(next.length === options.length ? [] : options.map(option => option.value).filter(item => next.includes(item)));
  }
  const fieldProps = { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined, 'aria-expanded': open, 'aria-controls': `${id}-list`, disabled: disabled || !options.length };
  return <div className="filter-field multi-select" ref={root}>
    <span id={`${id}-label`}>{label}</span>
    {searchable
      // The current selection is the placeholder, so the box reads "ทั้งหมด" / the chosen office until the user types.
      ? <div className={`multi-select-button multi-select-search${disabled || !options.length ? ' is-disabled' : ''}`}>
        <input type="search" role="combobox" aria-autocomplete="list" aria-labelledby={`${id}-label`} placeholder={summary} value={query} {...fieldProps}
          onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} />
        {chevron}
      </div>
      : <button type="button" className="multi-select-button" aria-haspopup="true" aria-labelledby={`${id}-label ${id}-value`} {...fieldProps} onClick={() => open ? close() : setOpen(true)}>
        <span id={`${id}-value`} className="multi-select-value">{summary}</span>
        {chevron}
      </button>}
    {open && <div className="multi-select-menu" id={`${id}-list`} role="group" aria-labelledby={`${id}-label`}>
      {!term && <label className="multi-select-option all"><input type="checkbox" checked={all} onChange={() => onChange([])} />{allLabel}</label>}
      {shown.map(option => <label className="multi-select-option" key={option.value}>
        <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggle(option.value)} />{option.label}
      </label>)}
      {!shown.length && <p className="multi-select-empty">ไม่พบ “{query.trim()}”</p>}
    </div>}
    {error && <p className="filter-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}
