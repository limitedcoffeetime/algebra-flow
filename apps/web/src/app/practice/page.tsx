'use client';

import { useMemo, useState } from 'react';
import { MathFieldInput } from '@/components/MathFieldInput';
import { ProblemCard } from '@/components/ProblemCard';
import { SolutionSteps } from '@/components/SolutionSteps';
import { useToast } from '@/components/ToastProvider';
import { ProblemApiData } from '@/lib/types';
import { verifyAnswer } from '@/lib/validation';
import { useAlgebraStore } from '@/store/algebraStore';

type ActionState = 'verify' | 'next';

interface PracticeSessionProps {
  problem: ProblemApiData;
  currentProblemIndex: number;
  batchSize: number;
}

function PracticeSession({
  problem,
  currentProblemIndex,
  batchSize,
}: PracticeSessionProps) {
  const recordAttempt = useAlgebraStore((state) => state.recordAttempt);
  const markSolutionViewed = useAlgebraStore((state) => state.markSolutionViewed);
  const advanceProblem = useAlgebraStore((state) => state.advanceProblem);
  const { showToast } = useToast();

  const [userAnswer, setUserAnswer] = useState('');
  const [actionState, setActionState] = useState<ActionState>('verify');
  const [showSolution, setShowSolution] = useState(false);
  const [hasRecordedAttempt, setHasRecordedAttempt] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showIncorrectActions, setShowIncorrectActions] = useState(false);

  const problemKey = problem.id ?? `${problem.problemType}-${currentProblemIndex}`;

  const handleVerify = () => {
    if (!userAnswer.trim()) {
      showToast({
        title: 'Enter an answer first.',
        variant: 'error',
      });
      return;
    }

    const result = verifyAnswer(userAnswer, problem);

    if (result.isCorrect) {
      if (!hasRecordedAttempt) {
        recordAttempt(problemKey, userAnswer, true);
        setHasRecordedAttempt(true);
      }

      setFeedbackMessage('Correct. You can continue or view the worked solution.');
      setActionState('next');
      setShowIncorrectActions(false);

      showToast({
        title: 'Correct answer',
        description: 'Great work.',
        variant: 'success',
      });
      return;
    }

    if (result.needsFeedback) {
      const message = result.feedbackMessage ?? 'Your answer is equivalent but not in the required form.';
      setFeedbackMessage(message);
      setShowIncorrectActions(false);

      showToast({
        title: 'Almost there',
        description: message,
        variant: 'info',
      });
      return;
    }

    const message = result.feedbackMessage ?? 'That answer is not correct yet.';
    setFeedbackMessage(message);
    setShowIncorrectActions(true);

    showToast({
      title: 'Not quite',
      description: message,
      variant: 'error',
    });
  };

  const handleShowSolution = () => {
    if (!hasRecordedAttempt) {
      recordAttempt(problemKey, userAnswer, false);
      setHasRecordedAttempt(true);
    }

    markSolutionViewed(problemKey);
    setShowSolution(true);
    setActionState('next');
    setShowIncorrectActions(false);
  };

  const handleContinue = () => {
    advanceProblem();
  };

  const progressLabel = `${currentProblemIndex + 1}/${batchSize}`;

  return (
    <>
      <ProblemCard problem={problem} progressLabel={progressLabel} />

      <section className="card">
        <h3 className="sectionTitle">Your Answer</h3>
        <MathFieldInput
          value={userAnswer}
          onChange={setUserAnswer}
          placeholder="Enter your answer"
          className="mathInput"
          autoFocus
        />

        <div className="buttonRow">
          {actionState === 'verify' ? (
            <button type="button" className="primaryButton" onClick={handleVerify}>
              Verify Answer
            </button>
          ) : (
            <button type="button" className="primaryButton" onClick={handleContinue}>
              Continue
            </button>
          )}

          {actionState === 'next' && !showSolution ? (
            <button type="button" className="secondaryButton" onClick={handleShowSolution}>
              Show Solution
            </button>
          ) : null}
        </div>

        {feedbackMessage ? <p className="feedbackText">{feedbackMessage}</p> : null}

        {showIncorrectActions ? (
          <div className="buttonRow">
            <button
              type="button"
              className="secondaryButton"
              onClick={() => setShowIncorrectActions(false)}
            >
              Try Again
            </button>
            <button type="button" className="dangerButton" onClick={handleShowSolution}>
              Show Solution
            </button>
          </div>
        ) : null}
      </section>

      <SolutionSteps steps={problem.solutionSteps} visible={showSolution} />
    </>
  );
}

export default function PracticePage() {
  const batch = useAlgebraStore((state) => state.batch);
  const currentProblemIndex = useAlgebraStore((state) => state.currentProblemIndex);
  const syncProblems = useAlgebraStore((state) => state.syncProblems);
  const isSyncing = useAlgebraStore((state) => state.isSyncing);
  const syncError = useAlgebraStore((state) => state.syncError);

  const { showToast } = useToast();

  const problem = useMemo(() => {
    if (!batch) return null;
    return batch.problems[currentProblemIndex] ?? null;
  }, [batch, currentProblemIndex]);

  if (!problem) {
    return (
      <div className="stack">
        <section className="card">
          <h1>Practice</h1>
          <p>No local problem batch is loaded yet.</p>
          <button
            type="button"
            className="primaryButton"
            onClick={() => {
              void syncProblems(true).then((result) => {
                showToast({
                  title: result.updated ? 'Sync complete' : 'Sync status',
                  description: result.message,
                  variant: result.updated ? 'success' : 'info',
                });
              });
            }}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Download Problems'}
          </button>
          {syncError ? <p className="errorText">{syncError}</p> : null}
        </section>
      </div>
    );
  }

  const sessionKey = problem.id ?? `${problem.problemType}-${currentProblemIndex}`;

  return (
    <div className="stack">
      <PracticeSession
        key={sessionKey}
        problem={problem}
        currentProblemIndex={currentProblemIndex}
        batchSize={batch?.problems.length ?? 0}
      />
    </div>
  );
}
