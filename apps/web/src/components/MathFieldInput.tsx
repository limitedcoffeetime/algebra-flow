'use client';

import { useEffect, useRef } from 'react';

type MathfieldLike = HTMLElement & {
  value: string;
  readOnly: boolean;
  mathVirtualKeyboardPolicy?: 'auto' | 'manual' | 'sandboxed' | 'off';
  smartFence?: boolean;
  smartSuperscript?: boolean;
};

let mathLiveInitPromise: Promise<void> | null = null;

async function initMathLive(): Promise<void> {
  if (!mathLiveInitPromise) {
    mathLiveInitPromise = import('mathlive').then(() => undefined);
  }

  return mathLiveInitPromise;
}

interface MathFieldInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function MathFieldInput({
  value,
  onChange,
  placeholder,
  readOnly = false,
  autoFocus = false,
  className,
}: MathFieldInputProps) {
  const ref = useRef<MathfieldLike | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      await initMathLive();
      if (cancelled || !ref.current) return;

      ref.current.mathVirtualKeyboardPolicy = 'auto';
      ref.current.smartFence = true;
      ref.current.smartSuperscript = false;
      ref.current.readOnly = readOnly;

      if (autoFocus && !readOnly) {
        ref.current.focus();
      }

      const onInput = () => {
        if (!ref.current) return;
        onChange(ref.current.value);
      };

      ref.current.addEventListener('input', onInput);

      return () => {
        ref.current?.removeEventListener('input', onInput);
      };
    };

    const cleanupPromise = setup();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [autoFocus, onChange, readOnly]);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.value !== value) {
      ref.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.readOnly = readOnly;
  }, [readOnly]);

  return (
    <math-field
      ref={(node: Element | null) => {
        ref.current = node as MathfieldLike | null;
      }}
      aria-label={placeholder ?? 'Math answer input'}
      className={className}
    />
  );
}
