/**
 * AlertProvider - Gestion globale des alertes personnalisées
 */

import React, { createContext, useContext, useState } from 'react';
import { CustomAlert } from './CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK', style: 'default' }],
  });

  const showAlert = (options: AlertOptions) => {
    setAlertOptions({
      ...options,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
    setAlertVisible(true);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlert
        visible={alertVisible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

// Export pour remplacer Alert.alert
export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { type?: 'success' | 'error' | 'warning' | 'info' }
  ) => {
    // Cette fonction sera utilisée avec le hook useAlert
    // Pour une migration progressive, on garde la signature Alert.alert
    console.warn('Alert.alert called - should use useAlert hook instead');
  },
};

