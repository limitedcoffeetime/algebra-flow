import { StyleSheet } from 'react-native';

/**
 * Common style utilities to reduce repetitive patterns
 */

export const commonStyles = StyleSheet.create({
  // Layout patterns
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },

  section: {
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Typography patterns
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#3b82f6',
  },

  label: {
    fontSize: 16,
    color: '#94a3b8',
  },

  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },

  // Button patterns
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Color variants
  primaryBackground: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  warningBackground: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  dangerBackground: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },

  // Common spacings
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 16,
    padding: 20,
  },
});

/**
 * Helper function to combine styles
 */
export const combineStyles = (...styles: (object | undefined | null)[]) => {
  return StyleSheet.flatten(styles);
};
