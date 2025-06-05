import Button from '@/components/Button';
import { getDatabaseType } from '@/services/database';
import { useProblemStore } from '@/store/problemStore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { resetProgress, getBatchesInfo, forceSync } = useProblemStore();
  const [isResetting, setIsResetting] = useState(false);
  const [batchesInfo, setBatchesInfo] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get current database type
  const databaseType = getDatabaseType();

  // Load batch information on component mount
  useEffect(() => {
    loadBatchesInfo();
  }, []);

  const loadBatchesInfo = async () => {
    setIsLoadingBatches(true);
    try {
      console.log('🔄 Settings: Loading batches info...');
      const info = await getBatchesInfo();
      console.log('🔄 Settings: Received batch info:', info.length, 'batches');
      setBatchesInfo(info);
      console.log('🔄 Settings: Updated state with new batch info');
    } catch (error) {
      console.error('Failed to load batches info:', error);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
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
              await resetProgress();
              Alert.alert('Success', 'Your progress has been reset!');
              // Reload batch info after reset
              await loadBatchesInfo();
            } catch (error) {
              console.error('Failed to reset progress:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
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
      console.log('🔄 Manually triggering sync...');
      const hasNewProblems = await forceSync();

      if (hasNewProblems) {
        Alert.alert('Success', 'Downloaded new problem batches!');
        // Add a small delay to ensure database transactions are complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        Alert.alert('Up to Date', 'No new problem batches available.');
      }

      // Refresh the local data after sync
      console.log('🔄 Refreshing batch info after sync...');
      await loadBatchesInfo();
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Sync Failed', 'Could not check for new problems. Please check your internet connection.');
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
          {databaseType === 'Mock Database'
            ? 'Using in-memory mock database for development. Data will be lost when app is closed.'
            : 'Using SQLite database. Data is persisted locally on your device.'
          }
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
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
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd33d',
    marginBottom: 15,
  },

  // Batch Status Styles
  loadingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  currentBatchCard: {
    borderColor: '#ffd33d',
    backgroundColor: '#3a3520',
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
    color: '#ffd33d',
  },
  currentBadge: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#ffd33d',
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
    color: '#ccc',
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
    color: '#aaa',
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
    color: '#ffd33d',
  },
  databaseHelpText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
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
    color: '#999',
    textAlign: 'center',
  },
});
