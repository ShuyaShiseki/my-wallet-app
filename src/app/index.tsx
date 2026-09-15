
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWallet, type AccountType } from '@/context/wallet-context';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);

export default function HomeScreen() {
  const { balances, history, addExpense, addWithdrawal, addDeposit } = useWallet();
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<AccountType>('bank');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'success' | 'error'>('success');

  const balanceSummary = useMemo(
    () => [
      { label: '銀行残高', value: balances.bank, accent: '#3c87f7' },
      { label: '財布残高', value: balances.wallet, accent: '#f59e0b' },
    ],
    [balances],
  );

  const monthlyExpenseTotal = useMemo(() => {
    const now = new Date();

    return history.reduce((sum, item) => {
      if (item.type !== 'expense') {
        return sum;
      }

      const createdAt = new Date(item.createdAt);
      if (
        createdAt.getFullYear() !== now.getFullYear() ||
        createdAt.getMonth() !== now.getMonth()
      ) {
        return sum;
      }

      return sum + item.amount;
    }, 0);
  }, [history]);

  const totalAssets = balances.bank + balances.wallet;
  const cashRatio = totalAssets === 0 ? 0 : (balances.wallet / totalAssets) * 100;

  const infoSummary = useMemo(
    () => [
      { label: '総資産', value: formatMoney(totalAssets) },
      { label: '今月支出', value: formatMoney(monthlyExpenseTotal) },
      { label: '現金比率', value: `${Math.round(cashRatio)}%` },
    ],
    [cashRatio, monthlyExpenseTotal, totalAssets],
  );

  const handleExpenseSubmit = () => {
    const amount = Number(expenseAmount) || 0;
    const result = addExpense(selectedAccount, amount, expenseCategory);
    if (!result.ok) {
      if (result.reason === 'insufficient-funds') {
        Alert.alert(
          '残高不足',
          `${selectedAccount === 'bank' ? '銀行' : '財布'}の残高を超える支出は登録できません。`,
          [{ text: '確認' }],
        );
      }
      setStatusMessage(
        result.reason === 'insufficient-funds'
          ? '残高が不足しているため登録できません'
          : '金額とカテゴリを入力してください',
      );
      setStatusTone('error');
      return;
    }
    setExpenseAmount('');
    setExpenseCategory('');
    setStatusMessage('支出を登録しました');
    setStatusTone('success');
  };

  const handleTransferSubmit = () => {
    const amount = Number(transferAmount) || 0;
    const result =
      transferType === 'deposit' ? addDeposit(amount) : addWithdrawal(amount);

    if (!result.ok) {
      const source = transferType === 'deposit' ? '財布' : '銀行';
      if (result.reason === 'insufficient-funds') {
        Alert.alert('残高不足', `${source}残高を超える資金移動は登録できません。`, [
          { text: '確認' },
        ]);
      }
      setStatusMessage(
        result.reason === 'insufficient-funds'
          ? `${source}残高が不足しているため登録できません`
          : '資金移動額を入力してください',
      );
      setStatusTone('error');
      return;
    }
    setTransferAmount('');
    setStatusMessage(
      transferType === 'deposit' ? '財布から銀行へ預け入れました' : '銀行から財布へ引き出しました',
    );
    setStatusTone('success');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.pageTitle}>
            財布管理
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="small" themeColor="textSecondary">
              現在の残高
            </ThemedText>
            <View style={styles.balanceGrid}>
              {balanceSummary.map((item) => (
                <View key={item.label} style={styles.balanceBox}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.label}
                  </ThemedText>
                  <Text style={[styles.balanceValue, { color: item.accent }]}>
                    {formatMoney(item.value)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.infoGrid}>
              {infoSummary.map((item) => (
                <View key={item.label} style={styles.infoBox}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.label}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.infoValue}>
                    {item.value}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>

          {statusMessage ? (
            <View
              style={[
                styles.statusBanner,
                statusTone === 'success' ? styles.statusBannerSuccess : styles.statusBannerError,
              ]}>
              <ThemedText type="smallBold" style={styles.statusText}>
                {statusMessage}
              </ThemedText>
            </View>
          ) : null}

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              支出登録
            </ThemedText>
            <View style={styles.accountRow}>
              {(['bank', 'wallet'] as const).map((account) => (
                <Pressable
                  key={account}
                  onPress={() => setSelectedAccount(account)}
                  style={({ pressed }) => [
                    styles.accountButton,
                    selectedAccount === account && styles.accountButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}>
                  <ThemedText style={styles.accountButtonText}>
                    {account === 'bank' ? '銀行' : '財布'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.inlineInputs}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" themeColor="textSecondary">
                  金額
                </ThemedText>
                <TextInput
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                  keyboardType="number-pad"
                  placeholder="例: 2500"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <ThemedText type="small" themeColor="textSecondary">
                  カテゴリ
                </ThemedText>
                <TextInput
                  value={expenseCategory}
                  onChangeText={setExpenseCategory}
                  placeholder="例: 食費"
                  style={styles.input}
                />
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={handleExpenseSubmit}>
              <ThemedText type="default" style={styles.buttonText}>
                支出を登録
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              資金移動
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              預け入れまたは引き出しを選択します。
            </ThemedText>
            <View style={styles.accountRow}>
              {(['deposit', 'withdrawal'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setTransferType(type)}
                  style={({ pressed }) => [
                    styles.accountButton,
                    transferType === type && styles.accountButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}>
                  <ThemedText style={styles.accountButtonText}>
                    {type === 'deposit' ? '預け入れ' : '引き出し'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={transferAmount}
              onChangeText={setTransferAmount}
              keyboardType="number-pad"
              placeholder={transferType === 'deposit' ? '預け入れ額' : '引き出し額'}
              style={styles.input}
            />
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handleTransferSubmit}>
              <ThemedText type="default" style={styles.buttonText}>
                {transferType === 'deposit' ? '財布から銀行へ預け入れ' : '銀行から財布へ引き出し'}
              </ThemedText>
            </Pressable>
          </ThemedView>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  pageTitle: {
    marginTop: Spacing.one,
  },
  summaryCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  balanceBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  infoBox: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.04)',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  infoValue: {
    fontSize: 18,
  },
  statusBanner: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  statusBannerSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusBannerError: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    color: '#111827',
  },
  formCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 32,
  },
  inlineInputs: {
    gap: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  accountRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  accountButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  accountButtonSelected: {
    backgroundColor: '#3c87f7',
  },
  accountButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
