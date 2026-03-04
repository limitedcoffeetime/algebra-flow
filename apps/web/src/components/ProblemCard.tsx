'use client';

import { getAnswerFormatInstructions } from '@/lib/answerInstructions';
import { ProblemApiData } from '@/lib/types';
import { LatexView } from './LatexView';

interface ProblemCardProps {
  problem: ProblemApiData;
  progressLabel?: string;
}

export function ProblemCard({ problem, progressLabel }: ProblemCardProps) {
  return (
    <section className="card">
      <div className="cardHeader">
        <h2 className="cardTitle">Practice Problem</h2>
        <div className="cardHeaderRight">
          <span className="difficultyBadge">{problem.difficulty}</span>
          {progressLabel ? <span className="progressLabel">{progressLabel}</span> : null}
        </div>
      </div>

      <p className="directionText">{problem.direction}</p>

      <div className="equationsList">
        {problem.equations.map((equation, index) => (
          <div key={`${problem.id ?? index}-${index}`} className="equationRow">
            <LatexView latex={equation} className="mathReadonly" />
          </div>
        ))}
      </div>

      <p className="answerHint">
        <strong>Answer Format:</strong> {getAnswerFormatInstructions(problem.problemType)}
      </p>
    </section>
  );
}
