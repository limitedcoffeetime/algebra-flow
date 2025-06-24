import Button from '@/components/Button';
import { useUserProgressStore } from '@/store';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const tips = [
  "Focus on one problem at a time",
  "Don't rush - understand each step",
  "Practice makes perfect",
  "Check your work before submitting",
];

export default function HomeScreen() {
  const userProgressStore = useUserProgressStore();

  // Get a random tip (deterministic based on day for consistency)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const currentTip = tips[dayOfYear % tips.length];

  const handleStartPractice = () => {
    router.push('/(tabs)/mathlive-test');
  };

  const handleOpenSettings = () => {
    router.push('/(tabs)/settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* App Title */}
        <View style={styles.headerSection}>
          <Text style={styles.appTitle}>🧮 Algebro</Text>
          <Text style={styles.subtitle}>Master algebra with step-by-step practice</Text>
        </View>

        {/* Progress Summary (if available) */}
        {userProgressStore.userProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProgressStore.userProgress.problemsCorrect}</Text>
                <Text style={styles.statLabel}>Solved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProgressStore.userProgress.problemsAttempted}</Text>
                <Text style={styles.statLabel}>Attempted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {userProgressStore.userProgress.problemsAttempted > 0
                    ? Math.round((userProgressStore.userProgress.problemsCorrect / userProgressStore.userProgress.problemsAttempted) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Action Buttons */}
        <View style={styles.actionsSection}>
          <View style={styles.primaryButtonContainer}>
            <Button
              label="📚 Start Practice"
              onPress={handleStartPractice}
              theme="primary"
            />
          </View>

          <View style={styles.secondaryButtonContainer}>
            <Button
              label="⚙️ Settings"
              onPress={handleOpenSettings}
              theme="secondary"
            />
          </View>
        </View>

        {/* Tip of the Day */}
        <View style={styles.tipSection}>
          <Text style={styles.tipLabel}>💡 Tip:</Text>
          <Text style={styles.tipText}>{currentTip}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressSection: {
    width: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#374151',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  actionsSection: {
    width: '100%',
    marginBottom: 30,
  },
  primaryButtonContainer: {
    marginBottom: 15,
  },
  secondaryButtonContainer: {
    // Secondary button styling
  },
  tipSection: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  tipLabel: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
});
