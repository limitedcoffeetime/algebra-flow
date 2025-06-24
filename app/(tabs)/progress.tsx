import { databaseService } from '@/services/domain';
import { useUserProgressStore } from '@/store';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Keep the interface compatible for now, will be restructured in Phase 4
interface TopicAccuracy {
  problemType: string;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy?: number; // New enhanced interface includes accuracy percentage
}

export default function ProgressScreen() {
  const { userProgress } = useUserProgressStore();
  const [topicStats, setTopicStats] = useState<TopicAccuracy[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Use the enhanced accuracy stats that include accuracy percentage
      const stats = await databaseService.problems.getAccuracyStats();
      setTopicStats(stats);
    };
    fetchStats();
  }, [userProgress]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Progress</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Stats</Text>
        {userProgress ? (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Problems Attempted:</Text>
              <Text style={styles.statValue}>{userProgress.problemsAttempted}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Problems Correct:</Text>
              <Text style={styles.statValue}>{userProgress.problemsCorrect}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Accuracy:</Text>
              <Text style={styles.statValue}>
                {userProgress.problemsAttempted > 0
                  ? `${Math.round((userProgress.problemsCorrect / userProgress.problemsAttempted) * 100)}%`
                  : '0%'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>No progress data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accuracy by Topic</Text>
        {topicStats.length === 0 ? (
          <Text style={styles.noDataText}>No attempts yet</Text>
        ) : (
          <View style={styles.statsContainer}>
            {topicStats.map((stat) => (
              <View key={stat.problemType} style={styles.statItem}>
                <Text style={styles.statLabel}>{stat.problemType}</Text>
                <Text style={styles.statValue}>
                  {stat.correct}/{stat.attempted} correct
                  {stat.accuracy !== undefined && (
                    <Text style={styles.accuracyText}> ({stat.accuracy.toFixed(0)}%)</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 15,
  },
  statsContainer: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  accuracyText: {
    fontSize: 14,
    color: '#10b981',
    opacity: 0.8,
  },
  noDataText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
