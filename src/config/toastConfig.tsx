/**
 * Configuration personnalisée des Toasts
 * Design Corail : Rouge/Orange élégant
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  /*
    Overwrite 'success' type,
    by modifying the existing `BaseToast` component
  */
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10b981',
        backgroundColor: '#1e293b',
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#e2e8f0',
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400',
        color: '#94a3b8',
      }}
    />
  ),
  /*
    Overwrite 'error' type,
    by modifying the existing `ErrorToast` component
  */
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: '#1e293b',
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#e2e8f0',
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400',
        color: '#94a3b8',
      }}
    />
  ),
  /*
    Overwrite 'info' type
  */
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#0ea5e9',
        backgroundColor: '#1e293b',
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#e2e8f0',
      }}
      text2Style={{
        fontSize: 14,
        fontWeight: '400',
        color: '#94a3b8',
      }}
    />
  ),
  /*
    Custom toast Corail (orange)
  */
  corail: (props: any) => (
    <View style={styles.coralToast}>
      <View style={styles.coralIconContainer}>
        <Text style={styles.coralIcon}>🪸</Text>
      </View>
      <View style={styles.coralTextContainer}>
        <Text style={styles.coralTitle}>{props.text1}</Text>
        {props.text2 && <Text style={styles.coralMessage}>{props.text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  coralToast: {
    width: '90%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ff6b47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#ff6b47',
  },
  coralIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 71, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coralIcon: {
    fontSize: 20,
  },
  coralTextContainer: {
    flex: 1,
  },
  coralTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  coralMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94a3b8',
  },
});

