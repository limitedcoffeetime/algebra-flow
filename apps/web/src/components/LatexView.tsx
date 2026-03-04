'use client';

import { useEffect, useRef } from 'react';

type MathfieldLike = HTMLElement & {
  value: string;
  readOnly: boolean;
  mathVirtualKeyboardPolicy?: 'auto' | 'manual' | 'sandboxed' | 'off';
};

let mathLiveInitPromise: Promise<void> | null = null;

async function initMathLive(): Promise<void> {
  if (!mathLiveInitPromise) {
    mathLiveInitPromise = import('mathlive').then(() => undefined);
  }

  return mathLiveInitPromise;
}

interface LatexViewProps {
  latex: string;
  className?: string;
}

export function LatexView({ latex, className }: LatexViewProps) {
  const ref = useRef<MathfieldLike | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      await initMathLive();
      if (cancelled || !ref.current) return;

      ref.current.mathVirtualKeyboardPolicy = 'off';
      ref.current.readOnly = true;
      ref.current.value = latex;
    };

    setup();

    return () => {
      cancelled = true;
    };
  }, [latex]);

  return (
    <math-field
      ref={(node: Element | null) => {
        ref.current = node as MathfieldLike | null;
      }}
      className={className}
      readonly
      aria-readonly="true"
    />
  );
}
