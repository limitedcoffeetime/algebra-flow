import BatchManager from '@/components/BatchManager';
import Button from '@/components/Button';
import { BatchInfo } from '@/services/types/api';
import { useSyncStore, useUserProgressStore } from '@/store';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import * as Sentry from '@sentry/react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

// Simple function to get database type - will remain SQLite for now
const getDatabaseType = () => 'SQLite';

export default function SettingsScreen() {
  const userProgressStore = useUserProgressStore();
  const syncStore = useSyncStore();

  const [isResetting, setIsResetting] = useState(false);
  const [batchesInfo, setBatchesInfo] = useState<BatchInfo[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBatchManager, setShowBatchManager] = useState(false);

  // Get current database type
  const databaseType = getDatabaseType();

  // Load batch information on component mount
  const loadBatchesInfo = useCallback(async () => {
    setIsLoadingBatches(true);
    try {
      const info = await syncStore.getBatchesInfo();
      setBatchesInfo(info);
    } catch (error) {
      logger.error('Failed to load batches info:', error);
    } finally {
      setIsLoadingBatches(false);
    }
  }, [syncStore]);

  useEffect(() => {
    loadBatchesInfo();
  }, [loadBatchesInfo]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch (error) {
      handleError(error, `formatting date string: ${isoString}`, ErrorStrategy.SILENT);
      return 'Invalid date';
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all your progress? This will mark all problems as unsolved and reset your stats.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await userProgressStore.resetProgress();
              Alert.alert('Success', 'Your progress has been reset!');
              // Reload batch info after reset
              await loadBatchesInfo();
            } catch (error) {
              logger.error('Failed to reset progress:', error);
              Alert.alert('Error', 'Failed to reset progress');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleRefreshAndSync = async () => {
    setIsSyncing(true);
    try {
      const hasNewProblems = await syncStore.forceSync();

      if (hasNewProblems) {
        Alert.alert('Success', 'Downloaded new problem batches!');
        // Add a small delay to ensure database transactions are complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        Alert.alert('Up to Date', 'No new problem batches available.');
      }

      // Refresh the local data after sync
      await loadBatchesInfo();
    } catch (error) {
      logger.error('Sync failed:', error);
      Alert.alert('Error', 'Failed to force sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Settings</Text>

      {/* Batch Status Section */}
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem Batch Status</Text>
          <View style={styles.buttonContainer}>
          <Button
            label={isSyncing ? "Syncing..." : isLoadingBatches ? "Loading..." : "Refresh & Sync"}
            onPress={handleRefreshAndSync}
            theme="primary"
          />
          </View>

          <View style={styles.buttonContainer}>
          <Button
            label="Manage Batches"
            onPress={() => setShowBatchManager(true)}
            theme="secondary"
          />
          </View>

        {isLoadingBatches ? (
          <Text style={styles.loadingText}>Loading batch information...</Text>
        ) : batchesInfo.length === 0 ? (
          <Text style={styles.noDataText}>No problem batches found</Text>
        ) : (
          <>
            <Text style={styles.batchSummaryText}>
              {batchesInfo.length} batch{batchesInfo.length !== 1 ? 'es' : ''} available on device
            </Text>
            {batchesInfo.map((batch, index) => (
              <View key={batch.id} style={[styles.batchCard, batch.isCurrentBatch && styles.currentBatchCard]}>
                <View style={styles.batchHeader}>
                  <Text style={[styles.batchTitle, batch.isCurrentBatch && styles.currentBatchTitle]}>
                    Batch {batch.id}
                    {batch.isCurrentBatch && <Text style={styles.currentBadge}> (Current)</Text>}
                  </Text>
                </View>

                <View style={styles.batchDetails}>
                  <View style={styles.batchRow}>
                    <Text style={styles.batchLabel}>Problems:</Text>
                    <Text style={styles.batchValue}>
                      {batch.completedCount}/{batch.problemCount} completed
                    </Text>
                  </View>

                  <View style={styles.batchRow}>
                    <Text style={styles.batchLabel}>Generated:</Text>
                    <Text style={styles.batchValue}>{formatDate(batch.generationDate)}</Text>
                  </View>

                  <View style={styles.batchRow}>
                    <Text style={styles.batchLabel}>Synced to device:</Text>
                    <Text style={styles.batchValue}>{formatDate(batch.importedAt)}</Text>
                  </View>

                  {batch.sourceUrl && (
                    <View style={styles.batchRow}>
                      <Text style={styles.batchLabel}>Source:</Text>
                      <Text style={styles.batchValueSmall} numberOfLines={1}>{batch.sourceUrl}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Database Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Status</Text>
        <View style={styles.databaseStatusContainer}>
          <Text style={styles.databaseTypeLabel}>Current Database:</Text>
          <Text style={styles.databaseTypeValue}>{databaseType}</Text>
        </View>
        <Text style={styles.databaseHelpText}>
          Using SQLite database with clean repository pattern. Data is persisted locally on your device.
        </Text>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.buttonContainer}>
          <Button
            label={isResetting ? "Resetting..." : "Reset Progress"}
            onPress={handleResetProgress}
            theme="primary"
          />
        </View>
        <Text style={styles.helpText}>
          This will reset all your progress and mark all problems as unsolved.
        </Text>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          Algebro - Your personal algebra learning companion
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>

        {/* Developer Test Section */}
        <View style={styles.devSection}>
          <Text style={styles.devSectionTitle}>Developer</Text>
          <View style={styles.buttonContainer}>
            <Button
              label="Test Error Reporting"
              onPress={() => {
                Alert.alert(
                  'Test Error',
                  'This will send a test error to Sentry for monitoring purposes.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send Test Error',
                      onPress: () => {
                        Sentry.captureException(new Error(`Test error from production app - ${new Date().toISOString()}`), {
                          tags: {
                            source: 'settings_test_button',
                            environment: __DEV__ ? 'development' : 'production',
                          },
                          extra: {
                            timestamp: Date.now(),
                            deviceType: 'mobile',
                          },
                        });
                        Alert.alert('Test Sent', 'Error test sent to monitoring system.');
                      },
                    },
                  ]
                );
              }}
              theme="secondary"
            />
          </View>
          <Text style={styles.devHelpText}>
            This helps verify error monitoring is working correctly.
          </Text>
        </View>
      </View>

      {/* Batch Manager Modal */}
      <Modal
        visible={showBatchManager}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Batch Manager</Text>
            <Button
              label="Done"
              onPress={() => {
                setShowBatchManager(false);
                // Refresh the batch info when closing the modal
                loadBatchesInfo();
              }}
              theme="primary"
            />
          </View>
          <BatchManager />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 15,
  },

  // Batch Status Styles
  loadingText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  batchSummaryText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    fontWeight: '600',
  },
  batchCard: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  currentBatchCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
  },
  batchHeader: {
    marginBottom: 10,
  },
  batchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentBatchTitle: {
    color: '#3b82f6',
  },
  currentBadge: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#10b981',
  },
  batchDetails: {
    gap: 6,
  },
  batchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchLabel: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  batchValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  batchValueSmall: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 2,
    textAlign: 'right',
  },

  // Database Status Styles
  databaseStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  databaseTypeLabel: {
    fontSize: 16,
    color: '#fff',
  },
  databaseTypeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  databaseHelpText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  devSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  devSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 10,
  },
  devHelpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
