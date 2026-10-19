import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { showToast } from '@/context/ToastContext';
import {
  AiSettings,
  DEFAULT_AI_SETTINGS,
  ProviderId,
  PROVIDER_OPTIONS,
  loadAiSettings,
  saveAiSettings,
} from '@/services/providerStorage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [providerListOpen, setProviderListOpen] = useState(false);

  const activeProvider = settings.activeProvider;
  const activeConfig = settings.providers[activeProvider];
  const activeLabel = useMemo(
    () =>
      PROVIDER_OPTIONS.find((p) => p.id === activeProvider)?.label ||
      activeProvider,
    [activeProvider]
  );

  useEffect(() => {
    (async () => {
      const loaded = await loadAiSettings();
      setSettings(loaded);
      setLoading(false);
    })();
  }, []);

  const updateProviderField = (
    field: 'apiKey' | 'baseUrl' | 'model',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [prev.activeProvider]: {
          ...prev.providers[prev.activeProvider],
          [field]: value,
        },
      },
    }));
  };

  const selectProvider = (provider: ProviderId) => {
    setSettings((prev) => ({ ...prev, activeProvider: provider }));
    setProviderListOpen(false);
  };

  const onSave = async () => {
    await saveAiSettings(settings);
    showToast('API settings saved locally');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.pageTitle}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>API Settings</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Active Provider</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setProviderListOpen((v) => !v)}>
            <Text style={styles.selectorText}>{activeLabel}</Text>
          </TouchableOpacity>

          {providerListOpen && (
            <View style={styles.dropdown}>
              {PROVIDER_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.dropdownItem}
                  onPress={() => selectProvider(p.id)}>
                  <Text style={styles.dropdownText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Model</Text>
          <TextInput
            value={activeConfig.model}
            onChangeText={(v) => updateProviderField('model', v)}
            style={styles.input}
            placeholder="e.g. deepseek/deepseek-r1:free"
            placeholderTextColor={Colors.iconMuted}
          />

          <Text style={styles.label}>Base URL</Text>
          <TextInput
            value={activeConfig.baseUrl}
            onChangeText={(v) => updateProviderField('baseUrl', v)}
            style={styles.input}
            autoCapitalize="none"
            placeholder="e.g. http://192.168.1.12:11434"
            placeholderTextColor={Colors.iconMuted}
          />

          <Text style={styles.label}>API Key</Text>
          <TextInput
            value={activeConfig.apiKey}
            onChangeText={(v) => updateProviderField('apiKey', v)}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Enter provider key"
            placeholderTextColor={Colors.iconMuted}
          />

          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.iconDark,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FAFAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    padding: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.iconDark,
    marginTop: 10,
    marginBottom: 8,
  },
  selector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: { color: Colors.iconDark, fontSize: 14, fontWeight: '600' },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownText: { color: Colors.iconDark, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.iconDark,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
