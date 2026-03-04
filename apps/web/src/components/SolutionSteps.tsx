'use client';

import { SolutionStep } from '@/lib/types';
import { LatexView } from './LatexView';

interface SolutionStepsProps {
  steps: SolutionStep[];
  visible: boolean;
}

export function SolutionSteps({ steps, visible }: SolutionStepsProps) {
  if (!visible || steps.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h3 className="sectionTitle">Step-by-Step Solution</h3>
      <div className="stepsList">
        {steps.map((step, index) => (
          <article key={`${step.mathExpression}-${index}`} className="stepItem">
            <div className="stepHeading">
              <span className="stepIndex">{index + 1}</span>
              <span>{step.explanation}</span>
            </div>
            <div className="stepMathWrap">
              <LatexView latex={step.mathExpression} className="mathReadonly" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
