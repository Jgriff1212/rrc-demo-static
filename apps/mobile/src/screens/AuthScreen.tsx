/**
 * Authentication Screen with magic link
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithEmail } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim().toLowerCase());
      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🎯</Text>
          </View>
          <Text style={styles.title}>Welcome to Reveal</Text>
          <Text style={styles.subtitle}>
            Complete tasks, reveal beautiful art
          </Text>
        </View>

        {!sent ? (
          <>
            <View style={styles.form}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Button
                title="Continue with Email"
                onPress={handleSignIn}
                loading={loading}
                disabled={!email.trim()}
                style={styles.button}
              />
            </View>

            <Text style={styles.disclaimer}>
              We'll send you a magic link to sign in.{'\n'}
              No password required!
            </Text>
          </>
        ) : (
          <View style={styles.sentContainer}>
            <Text style={styles.sentEmoji}>📧</Text>
            <Text style={styles.sentTitle}>Check your email!</Text>
            <Text style={styles.sentMessage}>
              We've sent a magic link to{'\n'}
              <Text style={styles.sentEmail}>{email}</Text>
            </Text>
            <Text style={styles.sentSubtext}>
              Click the link in the email to sign in.{'\n'}
              The link will expire in 1 hour.
            </Text>
            <Button
              title="Send another link"
              onPress={() => setSent(false)}
              variant="outline"
              style={styles.resendButton}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  disclaimer: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  sentContainer: {
    alignItems: 'center',
    padding: 24,
  },
  sentEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  sentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  sentMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  sentEmail: {
    fontWeight: '600',
    color: '#6366f1',
  },
  sentSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  resendButton: {
    width: '100%',
  },
});
