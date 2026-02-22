import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { transliterateToHindi } from '@/lib/sanscript';

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  showTransliteration?: boolean;
  compact?: boolean;
}

export default function ComboboxInput({ value, onChange, options, placeholder, className, showTransliteration, compact }: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const [hindiPreview, setHindiPreview] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced transliteration
  useEffect(() => {
    if (!showTransliteration || !input.trim()) { setHindiPreview(''); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setHindiPreview(transliterateToHindi(input));
    }, 100);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, showTransliteration]);

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(input.toLowerCase())),
    [options, input]
  );
  const showAddNew = input.trim() && !options.some(o => o.toLowerCase() === input.trim().toLowerCase());

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <Input
        value={input}
        onChange={(e) => { setInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={compact ? 'h-8 text-sm' : ''}
      />
      {showTransliteration && hindiPreview && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 pl-1" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {hindiPreview}
        </p>
      )}
      {open && (filtered.length > 0 || showAddNew) && (
        <div className="absolute z-[100] mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-48 overflow-auto">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
              onClick={() => { onChange(opt); setInput(opt); setOpen(false); }}
            >
              {opt}
              {showTransliteration && (
                <span className="ml-1.5 text-[0.75em] text-muted-foreground/60" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {transliterateToHindi(opt)}
                </span>
              )}
            </button>
          ))}
          {showAddNew && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent/50 transition-colors"
              onClick={() => { onChange(input.trim()); setOpen(false); }}
            >
              + New: "{input.trim()}"
              {showTransliteration && hindiPreview && (
                <span className="ml-1.5 text-[0.75em] text-muted-foreground/60" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {hindiPreview}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
