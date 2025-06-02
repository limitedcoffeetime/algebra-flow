import Button from '@/components/Button';
import { useProblemStore } from '@/store/problemStore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { userProgress, resetProgress, isLoading } = useProblemStore();
  const [isResetting, setIsResetting] = useState(false);

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
            } catch (error) {
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Settings</Text>

      {/* Progress Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Stats</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd33d',
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
    borderBottomColor: '#444',
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffd33d',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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
