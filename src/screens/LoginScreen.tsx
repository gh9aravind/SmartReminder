import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmail, signInWithGoogleIdToken } from '../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // Navigation updates automatically via the onAuthStateChange listener in App.tsx
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // See README.md → "Google Sign-In setup" for wiring up
    // @react-native-google-signin/google-signin to obtain this idToken.
    setError('Configure @react-native-google-signin first — see README.md');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Reminder</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title="Sign In" onPress={handleEmailLogin} />
          <View style={{ height: 12 }} />
          <Button title="Sign In with Google" onPress={handleGoogleLogin} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
});
