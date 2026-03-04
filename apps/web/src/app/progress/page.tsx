'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAlgebraStore } from '@/store/algebraStore';

export default function ProgressPage() {
  const batch = useAlgebraStore((state) => state.batch);
  const problemAttempts = useAlgebraStore((state) => state.problemAttempts);
  const problemsAttempted = useAlgebraStore((state) => state.problemsAttempted);
  const problemsCorrect = useAlgebraStore((state) => state.problemsCorrect);

  const accuracy = useMemo(() => {
    if (problemsAttempted === 0) return 0;
    return Math.round((problemsCorrect / problemsAttempted) * 100);
  }, [problemsAttempted, problemsCorrect]);

  const batchTotals = useMemo(() => {
    if (!batch) {
      return {
        total: 0,
        completed: 0,
        remaining: 0,
      };
    }

    const completed = batch.problems.reduce((count, problem, index) => {
      const id = problem.id ?? `${problem.problemType}-${index}`;
      return count + (problemAttempts[id]?.isCompleted ? 1 : 0);
    }, 0);

    return {
      total: batch.problems.length,
      completed,
      remaining: Math.max(batch.problems.length - completed, 0),
    };
  }, [batch, problemAttempts]);

  const completionPercent = useMemo(() => {
    if (!batchTotals.total) return 0;
    return Math.round((batchTotals.completed / batchTotals.total) * 100);
  }, [batchTotals.completed, batchTotals.total]);

  return (
    <div className="stack">
      <section className="card">
        <h1>Progress</h1>
        <div className="statsGrid">
          <div className="statBlock">
            <span className="statLabel">Problems Attempted</span>
            <span className="statValue">{problemsAttempted}</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Problems Correct</span>
            <span className="statValue">{problemsCorrect}</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Accuracy</span>
            <span className="statValue">{accuracy}%</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Current Batch</h2>
        {batch ? (
          <>
            <div className="progressMeta">
              <strong>{completionPercent}% complete</strong>
              <span>
                {batchTotals.completed}/{batchTotals.total} solved
              </span>
            </div>
            <div className="progressMeter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
              <div className="progressMeterFill" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="statsGrid">
              <div className="statBlock">
                <span className="statLabel">Batch ID</span>
                <span className="statValue">{batch.id}</span>
              </div>
              <div className="statBlock">
                <span className="statLabel">Completed</span>
                <span className="statValue">{batchTotals.completed}</span>
              </div>
              <div className="statBlock">
                <span className="statLabel">Remaining</span>
                <span className="statValue">{batchTotals.remaining}</span>
              </div>
              <div className="statBlock">
                <span className="statLabel">Total Problems</span>
                <span className="statValue">{batchTotals.total}</span>
              </div>
            </div>
          </>
        ) : (
          <p>No batch is loaded yet. Go to Settings and run sync.</p>
        )}
      </section>

      <section className="card compactCard">
        <div className="buttonRow">
          <Link href="/practice" className="primaryButton">
            Continue Practice
          </Link>
          <Link href="/settings" className="secondaryButton">
            Adjust Filters
          </Link>
        </div>
      </section>
    </div>
  );
}
