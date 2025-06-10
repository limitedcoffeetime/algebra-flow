import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Container Styles
  container: {
    backgroundColor: '#1a1a2e',
  },

  // Input Display Styles
  inputContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12, //makes blue border look round
    padding: 16, //room for answer input
    margin: 16, //distance blue border has from edge of screen
    minHeight: 6, //min height of input box, looks like we are quite under the threshold, as only very large values have visual differences
    justifyContent: 'center',
    borderWidth: 2, //width of blue border
    borderColor: '#3b82f6',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    minHeight: 40,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    marginRight: 4,
  },
  prefixFallbackText: {
    fontSize: 20,
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginRight: 4,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  inputText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  keyboardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 4,
  },

  // Keyboard Container Styles
  keyboard: {
    backgroundColor: '#16213e',
    overflow: 'hidden',
  },
  keyboardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },

  // Special Function Key Styles
  specialKey: {
    backgroundColor: '#374151',
    minWidth: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  fractionKey: {
    alignItems: 'center',
  },
  fractionLine: {
    width: 20,
    height: 1,
    backgroundColor: '#ffffff',
    marginVertical: 2,
  },
  exponentKey: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  superscript: {
    fontSize: 12,
    marginLeft: 2,
    marginTop: -4,
  },
  variableKey: {
    backgroundColor: '#7c3aed',
    minWidth: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  backspaceKey: {
    backgroundColor: '#dc2626',
    minWidth: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },

  // Number Pad Styles
  numberKey: {
    backgroundColor: '#475569',
    width: (width - 64) / 4 - 8,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  operatorKey: {
    backgroundColor: '#f59e0b',
    width: (width - 64) / 4 - 8,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },

  // Submit Key Styles (only the small one)
  submitKey: {
    backgroundColor: '#10b981',
    width: ((width - 64) / 4) * 2 - 4,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  submitKeyDisabled: {
    backgroundColor: '#6b7280',
  },

  // Text Styles
  keyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  submitKeyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
