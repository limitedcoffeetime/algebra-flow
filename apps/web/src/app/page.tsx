'use client';

import { useMemo } from 'react';
import { PracticeSetupPanel } from '@/components/PracticeSetupPanel';
import { useAlgebraStore } from '@/store/algebraStore';

export default function HomePage() {
  const isHydrated = useAlgebraStore((state) => state.isHydrated);
  const batch = useAlgebraStore((state) => state.batch);
  const problemAttempts = useAlgebraStore((state) => state.problemAttempts);
  const problemsAttempted = useAlgebraStore((state) => state.problemsAttempted);
  const problemsCorrect = useAlgebraStore((state) => state.problemsCorrect);
  const syncError = useAlgebraStore((state) => state.syncError);

  const accuracy = useMemo(() => {
    if (problemsAttempted === 0) return 0;
    return Math.round((problemsCorrect / problemsAttempted) * 100);
  }, [problemsAttempted, problemsCorrect]);

  const problemsRemaining = useMemo(() => {
    if (!batch) {
      return 0;
    }

    return batch.problems.reduce((count, problem, index) => {
      const problemId = problem.id ?? `${problem.problemType}-${index}`;
      return count + (problemAttempts[problemId]?.isCorrect === true ? 0 : 1);
    }, 0);
  }, [batch, problemAttempts]);

  return (
    <div className="stack">
      <section className="hero card">
        <h1>Algebra Flow</h1>
        <p>Practice algebra problems in focused mixed-review sessions.</p>
      </section>

      {!isHydrated ? (
        <section className="card">
          <p>Loading your local progress...</p>
        </section>
      ) : null}

      {syncError ? (
        <section className="card warningCard">
          <h2>Update issue</h2>
          <p>{syncError}</p>
          <p>Open Settings and try updating your problem library again.</p>
        </section>
      ) : null}

      <PracticeSetupPanel context="home" />

      <section className="card">
        <h2>Current Progress</h2>
        <div className="statsGrid">
          <div className="statBlock">
            <span className="statLabel">Attempted</span>
            <span className="statValue">{problemsAttempted}</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Correct</span>
            <span className="statValue">{problemsCorrect}</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Accuracy</span>
            <span className="statValue">{accuracy}%</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Left To Solve</span>
            <span className="statValue">{problemsRemaining}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
