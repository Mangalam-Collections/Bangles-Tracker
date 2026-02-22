// Minimal persistent draft status indicator component
import { DraftStatus } from '@/hooks/use-draft-status';
import { Check } from '@/lib/icons';

interface DraftStatusIndicatorProps {
  status: DraftStatus;
  className?: string;
}

export function DraftStatusIndicator({ status, className = '' }: DraftStatusIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      {status === 'saving' && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="text-success font-medium">Saved</span>
        </>
      )}
    </div>
  );
}
