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
  onEnter?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function MathFieldInput({
  value,
  onChange,
  onEnter,
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

      const field = ref.current;

      field.mathVirtualKeyboardPolicy = 'auto';
      field.smartFence = true;
      field.smartSuperscript = false;
      field.readOnly = readOnly;

      if (autoFocus && !readOnly) {
        field.focus();
      }

      const onInput = () => {
        onChange(field.value);
      };

      const onKeyDown = (event: Event) => {
        if (!onEnter) {
          return;
        }

        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key !== 'Enter' || keyboardEvent.shiftKey) {
          return;
        }

        keyboardEvent.preventDefault();
        onEnter();
      };

      field.addEventListener('input', onInput);
      field.addEventListener('keydown', onKeyDown);

      return () => {
        field.removeEventListener('input', onInput);
        field.removeEventListener('keydown', onKeyDown);
      };
    };

    const cleanupPromise = setup();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [autoFocus, onChange, onEnter, readOnly]);

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
