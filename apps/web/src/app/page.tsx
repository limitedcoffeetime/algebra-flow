'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatDifficultyLabel, formatProblemTypeLabel } from '@/lib/problemLabels';
import { useAlgebraStore } from '@/store/algebraStore';

export default function HomePage() {
  const isHydrated = useAlgebraStore((state) => state.isHydrated);
  const batch = useAlgebraStore((state) => state.batch);
  const problemsAttempted = useAlgebraStore((state) => state.problemsAttempted);
  const problemsCorrect = useAlgebraStore((state) => state.problemsCorrect);
  const syncError = useAlgebraStore((state) => state.syncError);
  const selectedDifficulty = useAlgebraStore((state) => state.selectedDifficulty);
  const selectedProblemType = useAlgebraStore((state) => state.selectedProblemType);
  const randomSampling = useAlgebraStore((state) => state.randomSampling);
  const getFilteredProblemCount = useAlgebraStore((state) => state.getFilteredProblemCount);

  const accuracy = useMemo(() => {
    if (problemsAttempted === 0) return 0;
    return Math.round((problemsCorrect / problemsAttempted) * 100);
  }, [problemsAttempted, problemsCorrect]);

  const filteredProblemCount = getFilteredProblemCount();
  const hasBatch = Boolean(batch?.problems.length);

  return (
    <div className="stack">
      <section className="hero card">
        <h1>Algebra Flow</h1>
        <p>
          Practice algebra problems in your browser. Content syncs from the latest batch in S3.
        </p>
      </section>

      {!isHydrated ? (
        <section className="card">
          <p>Loading your local progress...</p>
        </section>
      ) : null}

      {syncError ? (
        <section className="card warningCard">
          <h2>Sync issue</h2>
          <p>{syncError}</p>
          <p>Open Settings and run a manual sync once your network/CORS settings are resolved.</p>
        </section>
      ) : null}

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
            <span className="statLabel">Batch</span>
            <span className="statValue">{batch?.id ?? 'Not synced yet'}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Practice Mode</h2>
        <p>
          Sampling: <strong>{randomSampling ? 'random' : 'ordered'}</strong> | Difficulty:{' '}
          <strong>{formatDifficultyLabel(selectedDifficulty)}</strong> | Type:{' '}
          <strong>{formatProblemTypeLabel(selectedProblemType)}</strong>
        </p>
        <p>
          Matching problems in current batch: <strong>{filteredProblemCount}</strong>
        </p>
      </section>

      <section className="card">
        <h2>Start</h2>
        <div className="buttonRow">
          {hasBatch ? (
            <Link href="/practice" className="primaryButton">
              Start Practice
            </Link>
          ) : (
            <Link href="/settings" className="primaryButton">
              Download Problems
            </Link>
          )}
          <Link href="/settings" className="secondaryButton">
            Sync Settings
          </Link>
        </div>
        {!hasBatch ? <p className="helperText">No local problem batch found yet.</p> : null}
      </section>
    </div>
  );
}
