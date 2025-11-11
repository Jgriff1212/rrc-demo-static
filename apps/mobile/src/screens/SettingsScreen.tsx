/**
 * Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { setProfile } = useAppStore();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [cameraOptIn, setCameraOptIn] = useState(profile?.camera_opt_in || false);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(profile?.leaderboard_opt_in ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          camera_opt_in: cameraOptIn,
          leaderboard_opt_in: leaderboardOptIn,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        display_name: displayName.trim() || null,
        camera_opt_in: cameraOptIn,
        leaderboard_opt_in: leaderboardOptIn,
      });

      Alert.alert('Success', 'Settings saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Your data export will be sent to your email within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>⚙️ Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
          />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.user_id || 'Not set'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Tier</Text>
            <Text style={[styles.infoValue, styles.tierBadge]}>
              {profile?.pro_tier?.toUpperCase() || 'FREE'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Streak</Text>
            <Text style={styles.infoValue}>{profile?.streak_count || 0} 🔥</Text>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Camera Access</Text>
              <Text style={styles.settingDescription}>
                Enable Reveal+Real feature to capture photos
              </Text>
            </View>
            <Switch
              value={cameraOptIn}
              onValueChange={setCameraOptIn}
              trackColor={{ false: '#cbd5e1', true: '#a5b4fc' }}
              thumbColor={cameraOptIn ? '#6366f1' : '#f1f5f9'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Leaderboard</Text>
              <Text style={styles.settingDescription}>
                Show my completion time on daily leaderboard
              </Text>
            </View>
            <Switch
              value={leaderboardOptIn}
              onValueChange={setLeaderboardOptIn}
              trackColor={{ false: '#cbd5e1', true: '#a5b4fc' }}
              thumbColor={leaderboardOptIn ? '#6366f1' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* Subscription Section */}
        {profile?.pro_tier === 'free' && (
          <View style={styles.upgradeSection}>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeDescription}>
              • Unlimited boards{'\n'}
              • Remove watermarks{'\n'}
              • Premium art styles{'\n'}
              • Streak insurance{'\n'}
              • Priority support
            </Text>
            <Button
              title="Upgrade Now"
              onPress={() => Alert.alert('Coming Soon', 'Pro subscription will be available soon!')}
            />
          </View>
        )}

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity style={styles.linkRow} onPress={handleDataExport}>
            <Text style={styles.linkText}>Export My Data</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Reveal v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for productivity</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  tierBadge: {
    backgroundColor: '#eef2ff',
    color: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  upgradeSection: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4338ca',
    marginBottom: 12,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#6366f1',
    lineHeight: 24,
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  linkArrow: {
    fontSize: 20,
    color: '#6366f1',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    marginBottom: 0,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
