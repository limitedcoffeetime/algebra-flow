import { db } from '@/services/database';
import { ProblemSyncService } from '@/services/problemSyncService';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface BatchInfo {
  local: {
    totalBatches: number;
    totalProblems: number;
    completedProblems: number;
    oldestBatch: string | null;
    newestBatch: string | null;
  };
  lastSync: string | null;
}

export default function BatchManager() {
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const loadBatchInfo = async () => {
    try {
      const [info, allBatches] = await Promise.all([
        ProblemSyncService.getBatchInfo(),
        db.getAllBatches()
      ]);

      setBatchInfo(info);
      setBatches(allBatches.sort((a, b) =>
        new Date(b.generationDate).getTime() - new Date(a.generationDate).getTime()
      ));
    } catch (error) {
      logger.error('Failed to load batch info:', error);
      Alert.alert('Error', 'Failed to load batch information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBatchInfo();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBatchInfo();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const hasNewProblems = await ProblemSyncService.syncProblems();
      if (hasNewProblems) {
        Alert.alert('Success', 'New problems synced successfully!');
        await loadBatchInfo();
      } else {
        Alert.alert('Info', 'No new problems available');
      }
    } catch (error) {
      logger.error('Sync failed:', error);
      Alert.alert('Error', 'Failed to sync problems');
    } finally {
      setSyncing(false);
    }
  };

  const handleCleanup = async () => {
    Alert.alert(
      'Clean Up Old Batches',
      'This will remove local batches that are no longer available on the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          style: 'destructive',
          onPress: async () => {
            setCleaning(true);
            try {
              const deletedCount = await ProblemSyncService.cleanupOrphanedBatches();
              if (deletedCount > 0) {
                Alert.alert('Success', `Removed ${deletedCount} old batches`);
                await loadBatchInfo();
              } else {
                Alert.alert('Info', 'No old batches found to remove');
              }
            } catch (error) {
              logger.error('Cleanup failed:', error);
              Alert.alert('Error', 'Failed to clean up old batches');
            } finally {
              setCleaning(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteBatch = async (batchId: string, batchDate: string) => {
    Alert.alert(
      'Delete Batch',
      `Delete batch from ${new Date(batchDate).toLocaleDateString()}?\n\nThis will remove all problems in this batch.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteProblemBatch(batchId);
              Alert.alert('Success', 'Batch deleted successfully');
              await loadBatchInfo();
            } catch (error) {
              logger.error('Failed to delete batch:', error);
              Alert.alert('Error', 'Failed to delete batch');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading batch information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Local Storage</Text>
        {batchInfo && (
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Batches:</Text>
              <Text style={styles.statValue}>{batchInfo.local.totalBatches}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Problems:</Text>
              <Text style={styles.statValue}>{batchInfo.local.totalProblems}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Completed:</Text>
              <Text style={styles.statValue}>
                {batchInfo.local.completedProblems} / {batchInfo.local.totalProblems}
                {batchInfo.local.totalProblems > 0 && (
                  <Text style={styles.percentage}>
                    {' '}({Math.round((batchInfo.local.completedProblems / batchInfo.local.totalProblems) * 100)}%)
                  </Text>
                )}
              </Text>
            </View>
            {batchInfo.lastSync && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Sync:</Text>
                <Text style={styles.statValue}>{formatDate(batchInfo.lastSync)}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Actions</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons name="cloud-download-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            {syncing ? 'Syncing...' : 'Sync New Problems'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.warningButton]}
          onPress={handleCleanup}
          disabled={cleaning}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            {cleaning ? 'Cleaning...' : 'Clean Up Old Batches'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Batches List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Local Batches</Text>
        {batches.length === 0 ? (
          <Text style={styles.emptyText}>No batches found</Text>
        ) : (
          batches.map((batch) => (
            <View key={batch.id} style={styles.batchItem}>
              <View style={styles.batchHeader}>
                <Text style={styles.batchDate}>{formatDate(batch.generationDate)}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteBatch(batch.id, batch.generationDate)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <Text style={styles.batchId}>ID: {batch.id}</Text>
              <Text style={styles.batchProblems}>{batch.problemCount} problems</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statsContainer: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  percentage: {
    color: '#007AFF',
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  batchItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  batchId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  batchProblems: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});
