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
    backgroundColor: '#f8f9fa',
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

  // Typography patterns
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },

  label: {
    fontSize: 16,
    color: '#666',
  },

  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  // Button patterns
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

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },

  // Color variants
  primaryBackground: { backgroundColor: '#007AFF' },
  warningBackground: { backgroundColor: '#FF9500' },
  dangerBackground: { backgroundColor: '#FF3B30' },

  // Common spacings
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});

/**
 * Helper function to combine styles
 */
export const combineStyles = (...styles: any[]) => {
  return StyleSheet.flatten(styles);
};
