// Custom hook for managing draft auto-save status
import { useState, useEffect, useRef, useCallback } from 'react';

export type DraftStatus = 'idle' | 'saving' | 'saved';

interface UseDraftStatusOptions {
  autoSaveDelay?: number; // Delay before showing "saving" status (ms)
  savedDisplayDuration?: number; // How long to show "saved" status (ms)
}

export function useDraftStatus(options: UseDraftStatusOptions = {}) {
  const {
    autoSaveDelay = 400,
    savedDisplayDuration = 3000,
  } = options;

  const [status, setStatus] = useState<DraftStatus>('idle');
  const savingTimerRef = useRef<NodeJS.Timeout>();
  const savedTimerRef = useRef<NodeJS.Timeout>();

  // Mark as saving (with debounce)
  const markSaving = useCallback(() => {
    // Clear any existing timers
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    setStatus('saving');
  }, []);

  // Mark as saved (will auto-fade after duration)
  const markSaved = useCallback(() => {
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    setStatus('saved');

    // Auto-fade back to idle after duration
    savedTimerRef.current = setTimeout(() => {
      setStatus('idle');
    }, savedDisplayDuration);
  }, [savedDisplayDuration]);

  // Reset to idle
  const reset = useCallback(() => {
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { status, markSaving, markSaved, reset };
}
