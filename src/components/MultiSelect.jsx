import React, { useEffect, useId, useRef, useState } from 'react';

/** Select-styled dropdown with checkboxes. An empty value means "ทั้งหมด". */
export default function MultiSelect({ label, options, value, onChange, disabled = false, error }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return undefined;
    const close = event => { if (!root.current.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); root.current.querySelector('button').focus(); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  const all = value.length === 0;
  const summary = all ? 'ทั้งหมด' : value.length === 1 ? options.find(option => option.value === value[0])?.label ?? String(value[0]) : `เลือก ${value.length} รายการ`;
  function toggle(optionValue) {
    const next = value.includes(optionValue) ? value.filter(item => item !== optionValue) : [...value, optionValue];
    // Ticking every option is the same as "ทั้งหมด".
    onChange(next.length === options.length ? [] : options.map(option => option.value).filter(item => next.includes(item)));
  }
  return <div className="filter-field multi-select" ref={root}>
    <span id={`${id}-label`}>{label}</span>
    <button type="button" className="multi-select-button" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} aria-haspopup="true" aria-expanded={open} aria-controls={`${id}-list`} aria-labelledby={`${id}-label ${id}-value`} disabled={disabled || !options.length} onClick={() => setOpen(current => !current)}>
      <span id={`${id}-value`} className="multi-select-value">{summary}</span>
      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {open && <div className="multi-select-menu" id={`${id}-list`} role="group" aria-labelledby={`${id}-label`}>
      <label className="multi-select-option all"><input type="checkbox" checked={all} onChange={() => onChange([])} />ทั้งหมด</label>
      {options.map(option => <label className="multi-select-option" key={option.value}>
        <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggle(option.value)} />{option.label}
      </label>)}
    </div>}
    {error && <p className="filter-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}
