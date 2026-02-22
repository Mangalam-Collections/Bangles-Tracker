import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

interface DualTextProps {
  tKey?: string;
  en?: string;
  hi?: string;
  className?: string;
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3' | 'h4' | 'label' | 'th' | 'td';
}

// For static translated strings via t() key
export function T({ tKey, className, as: Tag = 'span' }: { tKey: string; className?: string; as?: DualTextProps['as'] }) {
  const { hindiEnabled } = useLanguage();
  const val = t(tKey, hindiEnabled);
  return (
    <Tag className={className}>
      {val.en}
      {val.hi && <span className="ml-1 text-[0.75em] text-muted-foreground/60 font-normal" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{val.hi}</span>}
    </Tag>
  );
}

// For dynamic text (item names, party names) with transliteration
export function DualName({ en, hi, className }: { en: string; hi?: string; className?: string }) {
  const { hindiEnabled } = useLanguage();
  return (
    <span className={className}>
      <span className="font-medium">{en}</span>
      {hindiEnabled && hi && (
        <span className="ml-1 text-[0.75em] text-muted-foreground/60" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{hi}</span>
      )}
    </span>
  );
}
