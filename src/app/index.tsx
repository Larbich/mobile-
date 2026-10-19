import { Colors } from '@/constants/colors';
import {
  loadLocalProfile,
  saveLocalProfile,
} from '@/services/providerStorage';
import { AiSparklesIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const profile = await loadLocalProfile();
      if (profile) {
        router.replace('/(tabs)/chat');
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  const handleContinueLocal = async () => {
    try {
      setLoading(true);
      const now = Date.now();
      await saveLocalProfile({
        id: `local-${now}`,
        name: 'Local User',
        email: `local-${now}@muse.local`,
      });
      router.replace('/(tabs)/chat');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading local profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <View style={styles.glowRing} />

          <View style={styles.iconContainer}>
            <HugeiconsIcon
              icon={AiSparklesIcon}
              size={40}
              color={Colors.white}
              strokeWidth={1.75}
            />
          </View>

          <View style={styles.brandRow}>
            <Text style={styles.brandName}>Muse</Text>
            <Text style={styles.aiText}> AI</Text>
          </View>

          <Text style={styles.caption}>Standalone local-first mode</Text>
        </View>

        <View style={styles.actionContainer}>
          <Pressable
            onPress={handleContinueLocal}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue locally">
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.buttonText}>Continue locally</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -10,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.primaryGlow,
  },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  aiText: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.6,
  },
  caption: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    height: 54,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderFocus,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
});
