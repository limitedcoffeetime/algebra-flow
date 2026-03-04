'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { useAlgebraStore } from '@/store/algebraStore';

type PendingDialog = 'reset' | 'clear' | null;

export default function SettingsPage() {
  const latestInfo = useAlgebraStore((state) => state.latestInfo);
  const batch = useAlgebraStore((state) => state.batch);
  const isSyncing = useAlgebraStore((state) => state.isSyncing);
  const lastSyncTimestamp = useAlgebraStore((state) => state.lastSyncTimestamp);
  const syncError = useAlgebraStore((state) => state.syncError);
  const syncProblems = useAlgebraStore((state) => state.syncProblems);
  const resetProgress = useAlgebraStore((state) => state.resetProgress);
  const clearAllData = useAlgebraStore((state) => state.clearAllData);

  const { showToast } = useToast();
  const [dialog, setDialog] = useState<PendingDialog>(null);

  const formattedLastSync = useMemo(() => {
    if (!lastSyncTimestamp) return 'Never';
    return new Date(lastSyncTimestamp).toLocaleString();
  }, [lastSyncTimestamp]);

  const runSync = (force: boolean) => {
    void syncProblems(force).then((result) => {
      showToast({
        title: result.updated ? 'Sync complete' : 'Sync status',
        description: result.message,
        variant: result.updated ? 'success' : 'info',
      });
    });
  };

  return (
    <div className="stack">
      <section className="card">
        <h1>Settings</h1>
        <div className="statsGrid">
          <div className="statBlock">
            <span className="statLabel">Last Sync</span>
            <span className="statValue">{formattedLastSync}</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Latest Batch</span>
            <span className="statValue">{latestInfo?.batchId ?? batch?.id ?? 'Unknown'}</span>
          </div>
          <div className="statBlock">
            <span className="statLabel">Problems in Batch</span>
            <span className="statValue">{batch?.problems.length ?? latestInfo?.problemCount ?? 0}</span>
          </div>
        </div>

        {syncError ? <p className="errorText">{syncError}</p> : null}

        <div className="buttonRow">
          <button
            type="button"
            className="primaryButton"
            onClick={() => runSync(false)}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Refresh & Sync'}
          </button>
          <button
            type="button"
            className="secondaryButton"
            onClick={() => runSync(true)}
            disabled={isSyncing}
          >
            Force Sync
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Data Controls</h2>
        <div className="buttonColumn">
          <button type="button" className="secondaryButton" onClick={() => setDialog('reset')}>
            Reset Progress
          </button>
          <button type="button" className="dangerButton" onClick={() => setDialog('clear')}>
            Clear Local Data
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={dialog === 'reset'}
        title="Reset Progress"
        message="This resets attempted/correct counts and local completion state for the current browser."
        confirmText="Reset"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          resetProgress();
          setDialog(null);
          showToast({
            title: 'Progress reset',
            variant: 'success',
          });
        }}
      />

      <ConfirmDialog
        open={dialog === 'clear'}
        title="Clear Local Data"
        message="This removes local batches, progress, and sync cache. You can sync again afterward."
        confirmText="Clear Data"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          clearAllData();
          setDialog(null);
          showToast({
            title: 'Local data cleared',
            variant: 'success',
          });
        }}
      />
    </div>
  );
}
