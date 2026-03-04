'use client';

import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { DifficultyFilter } from '@/lib/problemFiltering';
import { formatDifficultyLabel, formatProblemTypeLabel } from '@/lib/problemLabels';
import { useAlgebraStore } from '@/store/algebraStore';

const difficultyOptions: DifficultyFilter[] = ['all', 'easy', 'medium', 'hard'];

interface PracticeSetupPanelProps {
  context: 'home' | 'practice';
  compact?: boolean;
}

export function PracticeSetupPanel({ context, compact = false }: PracticeSetupPanelProps) {
  const batch = useAlgebraStore((state) => state.batch);
  const selectedDifficulty = useAlgebraStore((state) => state.selectedDifficulty);
  const selectedProblemType = useAlgebraStore((state) => state.selectedProblemType);
  const setDifficultyFilter = useAlgebraStore((state) => state.setDifficultyFilter);
  const setProblemTypeFilter = useAlgebraStore((state) => state.setProblemTypeFilter);
  const resetPracticePreferences = useAlgebraStore((state) => state.resetPracticePreferences);
  const getAvailableProblemTypes = useAlgebraStore((state) => state.getAvailableProblemTypes);
  const getFilteredProblemCount = useAlgebraStore((state) => state.getFilteredProblemCount);

  const { showToast } = useToast();

  const hasBatch = Boolean(batch?.problems.length);
  const filteredProblemCount = getFilteredProblemCount();
  const availableProblemTypes = getAvailableProblemTypes();
  const hasMatches = filteredProblemCount > 0;

  const title = context === 'home' ? 'Choose What To Practice' : 'Adjust Your Practice Focus';
  const description =
    context === 'home'
      ? 'Set difficulty and topic before you start.'
      : 'Update your difficulty and topic in-session without leaving practice.';

  const handleReset = () => {
    resetPracticePreferences();
    showToast({
      title: 'Practice setup reset',
      description: 'Difficulty and topic filters cleared.',
      variant: 'success',
    });
  };

  return (
    <section className={`card practiceSetupCard ${compact ? 'practiceSetupCompact' : ''}`}>
      <div className="practiceSetupHeader">
        <h2>{title}</h2>
        {!compact ? <p>{description}</p> : null}
      </div>

      <div className="setupSection">
        <p className="setupLabel">Difficulty</p>
        <div className="choicePillRow" role="group" aria-label="Difficulty options">
          {difficultyOptions.map((difficulty) => {
            const isActive = selectedDifficulty === difficulty;
            return (
              <button
                key={difficulty}
                type="button"
                className={`choicePill ${isActive ? 'choicePillActive' : ''}`}
                aria-pressed={isActive}
                onClick={() => setDifficultyFilter(difficulty)}
              >
                {formatDifficultyLabel(difficulty)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="setupSection">
        <p className="setupLabel">Problem Type</p>
        {hasBatch ? (
          <div className="choicePillRow" role="group" aria-label="Problem type options">
            <button
              type="button"
              className={`choicePill ${selectedProblemType === 'all' ? 'choicePillActive' : ''}`}
              aria-pressed={selectedProblemType === 'all'}
              onClick={() => setProblemTypeFilter('all')}
            >
              {formatProblemTypeLabel('all')}
            </button>
            {availableProblemTypes.map((problemType) => {
              const isActive = selectedProblemType === problemType;
              return (
                <button
                  key={problemType}
                  type="button"
                  className={`choicePill ${isActive ? 'choicePillActive' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setProblemTypeFilter(problemType)}
                >
                  {formatProblemTypeLabel(problemType)}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="helperText">Update your problem library first to unlock topic selection.</p>
        )}
      </div>

      <div className="setupFooter">
        <p className="setupSummary">
          Current setup: <strong>{formatDifficultyLabel(selectedDifficulty)}</strong>,{' '}
          <strong>{formatProblemTypeLabel(selectedProblemType)}</strong>
        </p>
        <p className={`setupCount ${hasBatch && !hasMatches ? 'setupCountWarning' : ''}`}>
          Problems left to solve: <strong>{filteredProblemCount}</strong>
        </p>
        {hasBatch && !hasMatches ? (
          <p className="helperText">No unsolved problems in this setup. Change filters or reset.</p>
        ) : null}
        <div className="buttonRow">
          {context === 'home' ? (
            hasBatch ? (
              <Link href="/practice" className="primaryButton">
                {hasMatches ? 'Start Practice' : 'Open Practice'}
              </Link>
            ) : (
              <Link href="/settings" className="primaryButton">
                Download Problems
              </Link>
            )
          ) : null}
          <button type="button" className="secondaryButton" onClick={handleReset}>
            Reset Setup
          </button>
          <Link href="/settings" className="secondaryButton">
            Library & Data Settings
          </Link>
        </div>
      </div>
    </section>
  );
}
