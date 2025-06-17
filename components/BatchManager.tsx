import { ProblemBatch } from '@/repositories/models/ProblemBatch';
import { databaseService } from '@/services/domain';
import { BatchManagerInfo } from '@/services/types/api';
import { useSyncStore } from '@/store';
import { alertHelpers } from '@/utils/alertHelpers';
import { commonStyles } from '@/utils/commonStyles';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function BatchManager() {
  const syncStore = useSyncStore();

  const [batchInfo, setBatchInfo] = useState<BatchManagerInfo | null>(null);
  const [batches, setBatches] = useState<ProblemBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBatchInfo = useCallback(async () => {
    try {
      const [info, allBatches] = await Promise.all([
        syncStore.getBatchesInfo(),
        databaseService.batches.getAll()
      ]);

      // Transform getBatchesInfo result to match expected BatchInfo format
      const batchInfoFormatted = {
        local: {
          totalBatches: allBatches.length,
          totalProblems: allBatches.reduce((sum, batch) => sum + batch.problemCount, 0),
          completedProblems: info.reduce((sum, batch) => sum + batch.completedCount, 0),
          oldestBatch: allBatches.length > 0 ? allBatches[allBatches.length - 1]?.generationDate?.toISOString() || null : null,
          newestBatch: allBatches.length > 0 ? allBatches[0]?.generationDate?.toISOString() || null : null,
        },
        lastSync: syncStore.lastSyncTime
      };

      setBatchInfo(batchInfoFormatted);
      setBatches(allBatches.sort((a, b) =>
        b.generationDate.getTime() - a.generationDate.getTime()
      ));
    } catch (error) {
      logger.error('Failed to load batch info:', error);
      alertHelpers.error('Failed to load batch information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [syncStore]);

  useEffect(() => {
    loadBatchInfo();
  }, [loadBatchInfo]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBatchInfo();
  };

  const handleSync = async () => {
    try {
      const hasNewProblems = await syncStore.forceSync();
      if (hasNewProblems) {
        alertHelpers.success('New problems synced successfully!');
        await loadBatchInfo();
      } else {
        alertHelpers.info('No new problems available');
      }
    } catch (error) {
      logger.error('Sync failed:', error);
      alertHelpers.error('Failed to sync problems');
    }
  };

  const handleCleanup = async () => {
    const confirmed = await alertHelpers.confirm({
      title: 'Clean Up Old Batches',
      message: 'This will remove local batches that are no longer available on the server. Continue?',
      confirmText: 'Clean Up',
      isDestructive: true
    });

    if (!confirmed) return;

    try {
      const deletedCount = await syncStore.cleanupOrphanedBatches();
      if (deletedCount > 0) {
        alertHelpers.success(`Removed ${deletedCount} old batches`);
        await loadBatchInfo();
      } else {
        alertHelpers.info('No old batches found to remove');
      }
    } catch (error) {
      logger.error('Cleanup failed:', error);
      alertHelpers.error('Failed to clean up old batches');
    }
  };

  const handleDeleteBatch = async (batchId: string, batchDate: string) => {
    const confirmed = await alertHelpers.confirm({
      title: 'Delete Batch',
      message: `Delete batch from ${new Date(batchDate).toLocaleDateString()}?\n\nThis will remove all problems in this batch.`,
      confirmText: 'Delete',
      isDestructive: true
    });

    if (!confirmed) return;

    try {
      await databaseService.batches.delete(batchId);
      alertHelpers.success('Batch deleted successfully');
      await loadBatchInfo();
    } catch (error) {
      logger.error('Failed to delete batch:', error);
      alertHelpers.error('Failed to delete batch');
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={commonStyles.centerContainer}>
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
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>📊 Local Storage</Text>
        {batchInfo && (
          <View style={styles.statsContainer}>
            <View style={commonStyles.row}>
              <Text style={commonStyles.label}>Total Batches:</Text>
              <Text style={commonStyles.value}>{batchInfo.local.totalBatches}</Text>
            </View>
            <View style={commonStyles.row}>
              <Text style={commonStyles.label}>Total Problems:</Text>
              <Text style={commonStyles.value}>{batchInfo.local.totalProblems}</Text>
            </View>
            <View style={commonStyles.row}>
              <Text style={commonStyles.label}>Completed:</Text>
              <Text style={commonStyles.value}>
                {batchInfo.local.completedProblems} / {batchInfo.local.totalProblems}
                {batchInfo.local.totalProblems > 0 && (
                  <Text style={styles.percentage}>
                    {' '}({Math.round((batchInfo.local.completedProblems / batchInfo.local.totalProblems) * 100)}%)
                  </Text>
                )}
              </Text>
            </View>
            {batchInfo.lastSync && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Last Sync:</Text>
                <Text style={commonStyles.value}>{formatDate(batchInfo.lastSync)}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>🔧 Actions</Text>

        <TouchableOpacity
          style={[commonStyles.actionButton, commonStyles.primaryBackground]}
          onPress={handleSync}
          disabled={syncStore.isSyncing}
        >
          <Ionicons name="cloud-download-outline" size={20} color="white" />
          <Text style={commonStyles.buttonText}>
            {syncStore.isSyncing ? 'Syncing...' : 'Sync New Problems'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.actionButton, commonStyles.warningBackground]}
          onPress={handleCleanup}
          disabled={syncStore.isCleaningUp}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={commonStyles.buttonText}>
            {syncStore.isCleaningUp ? 'Cleaning...' : 'Clean Up Old Batches'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Batches List */}
      <View style={commonStyles.section}>
        <Text style={commonStyles.sectionTitle}>📚 Local Batches</Text>
        {batches.length === 0 ? (
          <Text style={commonStyles.emptyText}>No batches found</Text>
        ) : (
          batches.map((batch) => (
            <View key={batch.id} style={styles.batchItem}>
              <View style={commonStyles.row}>
                <Text style={styles.batchDate}>{formatDate(batch.generationDate)}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteBatch(batch.id, batch.generationDate.toISOString())}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    gap: 8,
  },
  percentage: {
    color: '#007AFF',
    fontSize: 14,
  },
  batchItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
});
