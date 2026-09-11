import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';

export default function SettingsScreen() {
  const { initialBalances, setInitialBalances } = useWallet();
  const [bank, setBank] = useState(String(initialBalances.bank));
  const [wallet, setWallet] = useState(String(initialBalances.wallet));
  const [message, setMessage] = useState('');

  useEffect(() => {
    setBank(String(initialBalances.bank));
    setWallet(String(initialBalances.wallet));
  }, [initialBalances]);

  const save = () => {
    setInitialBalances(Number(bank) || 0, Number(wallet) || 0);
    setMessage('初期残高を保存しました');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">設定</ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">初期残高の設定</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              アプリの基準となる銀行・財布残高を設定します。
            </ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText type="small">銀行残高</ThemedText>
              <TextInput value={bank} onChangeText={setBank} keyboardType="number-pad" style={styles.input} />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText type="small">財布残高</ThemedText>
              <TextInput value={wallet} onChangeText={setWallet} keyboardType="number-pad" style={styles.input} />
            </View>
            <Pressable style={styles.button} onPress={save}>
              <ThemedText style={styles.buttonText}>初期残高を保存</ThemedText>
            </Pressable>
            {message ? <ThemedText type="small">{message}</ThemedText> : null}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingBottom: BottomTabInset + Spacing.three, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  content: { padding: Spacing.four, gap: Spacing.three },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  inputGroup: { gap: Spacing.one },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: Spacing.two, padding: Spacing.two, backgroundColor: '#fff', color: '#111827' },
  button: { backgroundColor: '#111827', padding: Spacing.three, borderRadius: Spacing.two, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
