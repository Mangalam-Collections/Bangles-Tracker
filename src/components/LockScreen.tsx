import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Delete, Check, ShieldCheck } from '@/lib/icons';

export default function LockScreen() {
  const { hasPin, setPin, verifyPin } = useAuth();
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const maxLen = 4;

  const handleDigit = (d: string) => {
    setError('');
    if (isConfirming) {
      if (confirmPin.length < maxLen) setConfirmPin(prev => prev + d);
    } else {
      if (pin.length < maxLen) setPinValue(prev => prev + d);
    }
  };

  const handleDelete = () => {
    if (isConfirming) {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPinValue(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (hasPin) {
      if (pin.length === maxLen) {
        if (!verifyPin(pin)) {
          setError('Incorrect PIN');
          setPinValue('');
        }
      }
    } else {
      if (!isConfirming) {
        if (pin.length === maxLen) {
          setIsConfirming(true);
        }
      } else {
        if (confirmPin.length === maxLen) {
          if (pin === confirmPin) {
            setPin(pin);
          } else {
            setError('PINs do not match');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const currentValue = isConfirming ? confirmPin : pin;
  const title = hasPin ? 'Enter PIN' : isConfirming ? 'Confirm PIN' : 'Set Up PIN';
  const subtitle = hasPin
    ? 'Enter your 4-digit PIN to unlock'
    : isConfirming
    ? 'Re-enter your PIN to confirm'
    : 'Create a 4-digit PIN to secure your data';

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-primary px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10">
          <ShieldCheck className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">{title}</h1>
        <p className="text-sm text-primary-foreground/70">{subtitle}</p>
      </div>

      <div className="mb-4 flex gap-3">
        {Array.from({ length: maxLen }).map((_, i) => (
          <div
            key={i}
            className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
              i < currentValue.length
                ? 'bg-primary-foreground scale-110'
                : 'bg-primary-foreground/25'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm font-medium text-destructive-foreground bg-destructive/80 px-3 py-1 rounded-md">
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {keys.map((key) => {
          if (key === 'del') {
            return (
              <button
                key={key}
                onClick={handleDelete}
                className="flex h-16 items-center justify-center rounded-xl text-primary-foreground/70 active:bg-primary-foreground/10 transition-colors"
              >
                <Delete className="h-6 w-6" />
              </button>
            );
          }
          if (key === 'ok') {
            return (
              <button
                key={key}
                onClick={handleSubmit}
                disabled={currentValue.length < maxLen}
                className="flex h-16 items-center justify-center rounded-xl text-primary-foreground active:bg-primary-foreground/10 transition-colors disabled:opacity-30"
              >
                <Check className="h-6 w-6" />
              </button>
            );
          }
          return (
            <button
              key={key}
              onClick={() => handleDigit(key)}
              className="flex h-16 items-center justify-center rounded-xl bg-primary-foreground/10 text-xl font-semibold text-primary-foreground active:bg-primary-foreground/20 transition-colors"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
