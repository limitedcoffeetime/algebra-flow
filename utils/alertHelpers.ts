import { Alert } from 'react-native';

/**
 * Common alert patterns to reduce code duplication
 */

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const alertHelpers = {
  /**
   * Simple success alert
   */
  success: (message: string, title = 'Success') => {
    Alert.alert(title, message);
  },

  /**
   * Simple error alert
   */
  error: (message: string, title = 'Error') => {
    Alert.alert(title, message);
  },

  /**
   * Simple info alert
   */
  info: (message: string, title = 'Info') => {
    Alert.alert(title, message);
  },

  /**
   * Confirmation dialog with customizable options
   */
  confirm: (options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        options.title,
        options.message,
        [
          {
            text: options.cancelText || 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: options.confirmText || 'Confirm',
            style: options.isDestructive ? 'destructive' : 'default',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  },

  /**
   * Async wrapper that handles confirmation + action
   */
  confirmAndExecute: async (
    options: ConfirmationOptions,
    action: () => Promise<void>
  ): Promise<boolean> => {
    const confirmed = await alertHelpers.confirm(options);
    if (confirmed) {
      await action();
      return true;
    }
    return false;
  }
};
