import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debugLogger } from '../utils/debugLogger';

interface DebugLogsScreenProps {
  onClose: () => void;
}

export const DebugLogsScreen: React.FC<DebugLogsScreenProps> = ({ onClose }) => {
  const logs = debugLogger.getLogs();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🐛 Debug Logs</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logsContainer}>
        {logs.length === 0 ? (
          <Text style={styles.noLogs}>No logs yet</Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          debugLogger.clear();
          onClose();
        }}
      >
        <Text style={styles.clearButtonText}>Clear Logs</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fbbf24',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logsContainer: {
    flex: 1,
    padding: 15,
  },
  logEntry: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#e2e8f0',
    marginBottom: 4,
    lineHeight: 16,
  },
  noLogs: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

