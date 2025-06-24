import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  theme?: 'primary' | 'secondary';
  onPress?: () => void;
};

export default function Button({ label, theme, onPress }: Props) {
  if (theme === 'primary') {
    return (
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={onPress || (() => alert('You pressed a primary button.'))}
          >
          <Text style={[styles.buttonLabel, styles.primaryButtonLabel]}>{label}</Text>
        </Pressable>
      </View>
    );
  }

  if (theme === 'secondary') {
    return (
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={onPress || (() => alert('You pressed a secondary button.'))}
          >
          <Text style={[styles.buttonLabel, styles.secondaryButtonLabel]}>{label}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.buttonContainer}>
      <Pressable style={[styles.button, styles.defaultButton]} onPress={onPress || (() => alert('You pressed a button.'))}
      >
        <Text style={[styles.buttonLabel, styles.defaultButtonLabel]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    height: 50,
    marginHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  button: {
    borderRadius: 12,
    width: '100%',
    minWidth: 100,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  buttonIcon: {
    paddingRight: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Primary button - bright blue background
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  primaryButtonLabel: {
    color: '#ffffff',
  },

  // Secondary button - green background
  secondaryButton: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  secondaryButtonLabel: {
    color: '#ffffff',
  },

  // Default button - dark background
  defaultButton: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  defaultButtonLabel: {
    color: '#ffffff',
  },
});
