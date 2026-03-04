'use client';

import { useMemo, useState } from 'react';
import { MathFieldInput } from '@/components/MathFieldInput';
import { ProblemCard } from '@/components/ProblemCard';
import { PracticeSetupPanel } from '@/components/PracticeSetupPanel';
import { SolutionSteps } from '@/components/SolutionSteps';
import { useToast } from '@/components/ToastProvider';
import { ProblemApiData } from '@/lib/types';
import { verifyAnswer } from '@/lib/validation';
import { useAlgebraStore } from '@/store/algebraStore';

type ActionState = 'verify' | 'next';

interface PracticeSessionProps {
  problem: ProblemApiData;
  currentProblemIndex: number;
  progressLabel: string;
}

function PracticeSession({
  problem,
  currentProblemIndex,
  progressLabel,
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
    setFeedbackMessage('Review the worked solution, then continue when ready.');
  };

  const handleContinue = () => {
    advanceProblem();
  };

  return (
    <>
      <ProblemCard problem={problem} progressLabel={progressLabel} />

      <section className="card">
        <h3 className="sectionTitle">Your Answer</h3>
        <MathFieldInput
          value={userAnswer}
          onChange={setUserAnswer}
          onEnter={() => {
            if (actionState === 'verify') {
              handleVerify();
              return;
            }

            handleContinue();
          }}
          placeholder="Enter your answer"
          className="mathInput"
          autoFocus
        />
        <p className="helperText inputHint">
          Press <strong>Enter</strong> to {actionState === 'verify' ? 'verify your answer' : 'continue'}.
        </p>

        <div className="buttonRow">
          {actionState === 'verify' ? (
            <>
              <button type="button" className="primaryButton" onClick={handleVerify}>
                Verify Answer
              </button>
              <button type="button" className="secondaryButton" onClick={handleShowSolution}>
                Show Solution
              </button>
            </>
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

        {feedbackMessage ? (
          <p className="feedbackText" role="status" aria-live="polite">
            {feedbackMessage}
          </p>
        ) : null}

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
  const randomSampling = useAlgebraStore((state) => state.randomSampling);
  const getFilteredProblemCount = useAlgebraStore((state) => state.getFilteredProblemCount);
  const getCurrentProblemPosition = useAlgebraStore((state) => state.getCurrentProblemPosition);

  const { showToast } = useToast();

  const problem = useMemo(() => {
    if (!batch || currentProblemIndex < 0) return null;
    return batch.problems[currentProblemIndex] ?? null;
  }, [batch, currentProblemIndex]);

  const filteredProblemCount = getFilteredProblemCount();
  const currentProblemPosition = getCurrentProblemPosition();

  if (!batch) {
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

  if (!problem || filteredProblemCount === 0) {
    return (
      <div className="stack">
        <section className="card">
          <h1>Practice</h1>
          <p>No problems match your current setup.</p>
          <p>Use the setup controls below to select a different difficulty or topic.</p>
        </section>
        <PracticeSetupPanel context="practice" />
      </div>
    );
  }

  const positionLabel = currentProblemPosition ?? 1;
  const modeLabel = randomSampling ? 'random' : 'ordered';
  const progressLabel = `${positionLabel}/${filteredProblemCount} (${modeLabel})`;
  const sessionKey = problem.id ?? `${problem.problemType}-${currentProblemIndex}`;

  return (
    <div className="stack">
      <PracticeSetupPanel context="practice" compact />
      <PracticeSession
        key={sessionKey}
        problem={problem}
        currentProblemIndex={currentProblemIndex}
        progressLabel={progressLabel}
      />
    </div>
  );
}
