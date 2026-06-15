import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.0.2.2:3001';

export default function FirebaseTest() {
  const [testName, setTestName] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [result, setResult] = useState(null);
  const [savedData, setSavedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Write test data to Firebase
  const handleSaveData = async () => {
    if (!testName.trim() || !testMessage.trim()) {
      setResult({ success: false, message: 'Please fill in name and message!' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/test-firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: testName,
          message: testMessage,
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setTestName('');
        setTestMessage('');
        // Auto refresh list
        handleLoadData();
      }
    } catch (error) {
      setResult({ success: false, message: `Connection failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from Firebase
  const handleLoadData = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/test-firebase`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.success) {
        setSavedData(data.data);
        setResult({ success: true, message: `Successfully loaded ${data.data.length} records!` });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({ success: false, message: `Connection failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Firebase Test',
          headerStyle: { backgroundColor: '#1A1A1A' },
          headerTintColor: '#D5FF5F',
        }} 
      />

      <View style={styles.content}>
        <Text style={styles.title}>🔥 Firebase Connection Test</Text>
        <Text style={styles.subtitle}>Test if data can be successfully uploaded to Firestore</Text>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={testName}
            onChangeText={setTestName}
            placeholder="Enter test name..."
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Enter test message..."
            placeholderTextColor="#666"
            multiline
          />
        </View>

        {/* Button Section */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveData}
            disabled={isLoading}
          >
            <Ionicons name="cloud-upload" size={20} color="#000" />
            <Text style={styles.buttonText}>Upload Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.loadButton]}
            onPress={handleLoadData}
            disabled={isLoading}
          >
            <Ionicons name="cloud-download" size={20} color="#000" />
            <Text style={styles.buttonText}>Load Data</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D5FF5F" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {/* Result Display */}
        {result && (
          <View style={[
            styles.resultContainer,
            result.success ? styles.successResult : styles.errorResult
          ]}>
            <Ionicons 
              name={result.success ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={result.success ? "#4CAF50" : "#FF5252"} 
            />
            <Text style={styles.resultText}>
              {result.message || (result.success ? 'Operation successful!' : 'Operation failed')}
            </Text>
            {result.documentId && (
              <Text style={styles.docIdText}>Document ID: {result.documentId}</Text>
            )}
          </View>
        )}

        {/* Saved Data List */}
        {savedData.length > 0 && (
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>
              📋 Saved Data ({savedData.length} records)
            </Text>
            {savedData.map((item, index) => (
              <View key={item.id || index} style={styles.dataCard}>
                <Text style={styles.dataName}>{item.name}</Text>
                <Text style={styles.dataMessage}>{item.message}</Text>
                <Text style={styles.dataId}>ID: {item.id}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D5FF5F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#D5FF5F',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#D5FF5F',
  },
  loadButton: {
    backgroundColor: '#64B5F6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  successResult: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  errorResult: {
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  docIdText: {
    color: '#888',
    fontSize: 12,
    width: '100%',
  },
  dataSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#D5FF5F',
    marginBottom: 16,
    fontWeight: '600',
  },
  dataCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  dataName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D5FF5F',
    marginBottom: 4,
  },
  dataMessage: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  dataId: {
    fontSize: 12,
    color: '#666',
  },
});
