import React, { useEffect, useRef, useState } from 'react';
import { searchAcademicPrograms } from './academicCatalogue';
import './AcademicSelector.css';

export default function AcademicSelector({ id, label, options, selected, onChange, query, onQueryChange, required = false, disabled = false }) {
  const input = useRef(null), [open, setOpen] = useState(false), [active, setActive] = useState(0);
  const results = searchAcademicPrograms(options, query).filter(p => !selected.includes(p.name));
  useEffect(() => { input.current?.setCustomValidity(query.trim() ? `Select a listed ${id}, or clear the search.` : required && !selected.length ? 'Select at least one major.' : ''); }, [query, selected, required, id]);
  useEffect(() => setActive(0), [query, selected]);
  useEffect(() => { if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView?.({ block: 'nearest' }); }, [active, open, id, query]);
  const choose = p => { onChange([...selected, p.name]); onQueryChange(''); setActive(0); input.current.focus(); setOpen(false); };
  return <div className="academic-selector">
    <label htmlFor={id}>{label}{required && <span className="portal-required-mark" aria-hidden="true"> *</span>}</label>
    <div className="academic-selected">{selected.map(name => <span className="academic-chip" key={name}>{name}<button type="button" disabled={disabled} aria-label={`Remove ${name} ${id}`} onClick={() => onChange(selected.filter(s => s !== name))}>×</button></span>)}</div>
    <input ref={input} id={id} name={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-options`} aria-required={required} aria-activedescendant={open && results[active] ? `${id}-option-${active}` : undefined}
      required={required && !selected.length} disabled={disabled} autoComplete="off" placeholder={disabled ? 'Loading options…' : `Search ${id === 'major' ? 'majors' : 'minors'}…`} value={query}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onChange={e => { onQueryChange(e.target.value); setOpen(true); }}
      onKeyDown={e => {
        if (e.key === 'Escape') { setOpen(false); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive(i => open ? Math.max(0, Math.min(results.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1))) : 0); }
        if (e.key === 'Enter' && open) { e.preventDefault(); if (results[active]) choose(results[active]); }
      }} />
    {open && <div id={`${id}-options`} role="listbox" aria-label={`${label} options`} className="academic-options">{results.length ? results.map((p, i) => <div role="option" id={`${id}-option-${i}`} aria-selected={active === i} key={p.name} onMouseDown={e => e.preventDefault()} onClick={() => choose(p)} onMouseEnter={() => setActive(i)}>{p.name}<small>{p.school}{p.option === 'Adjunct Major' ? ' · Adjunct major' : ''}</small></div>) : <p>No matching options</p>}</div>}
    {query.trim() && <div className="academic-hint">Choose an option or <button type="button" onClick={() => onQueryChange('')}>clear search</button>.</div>}
  </div>;
}
