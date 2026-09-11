import { useMemo, useState } from 'react';
import {
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
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
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
    if (!addExpense(selectedAccount, amount, expenseCategory)) {
      setStatusMessage('金額とカテゴリを入力してください');
      setStatusTone('error');
      return;
    }
    setExpenseAmount('');
    setExpenseCategory('');
    setStatusMessage('支出を登録しました');
    setStatusTone('success');
  };

  const handleDepositSubmit = () => {
    const amount = Number(depositAmount) || 0;
    if (!addDeposit(amount)) {
      setStatusMessage('預け入れ額が財布残高を超えています');
      setStatusTone('error');
      return;
    }
    setDepositAmount('');
    setStatusMessage('財布から銀行へ預け入れました');
    setStatusTone('success');
  };

  const handleWithdrawalSubmit = () => {
    const amount = Number(withdrawalAmount) || 0;
    if (!addWithdrawal(amount)) {
      setStatusMessage('引き出し額を入力してください');
      setStatusTone('error');
      return;
    }
    setWithdrawalAmount('');
    setStatusMessage('銀行から現金へ移動しました');
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

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              預け入れ
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              財布から銀行へ資金を移動します。
            </ThemedText>
            <TextInput
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="number-pad"
              placeholder="例: 10000"
              style={styles.input}
            />
            <Pressable style={styles.secondaryButton} onPress={handleDepositSubmit}>
              <ThemedText type="default" style={styles.buttonText}>
                財布から銀行へ預け入れ
              </ThemedText>
            </Pressable>
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
                  style={[
                    styles.accountButton,
                    selectedAccount === account && styles.accountButtonSelected,
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
            <Pressable style={styles.primaryButton} onPress={handleExpenseSubmit}>
              <ThemedText type="default" style={styles.buttonText}>
                支出を登録
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.formCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              資金移動（引き出し）
            </ThemedText>
            <View style={styles.inlineInputs}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" themeColor="textSecondary">
                  引き出し額
                </ThemedText>
                <TextInput
                  value={withdrawalAmount}
                  onChangeText={setWithdrawalAmount}
                  keyboardType="number-pad"
                  placeholder="例: 30000"
                  style={styles.input}
                />
              </View>
            </View>
            <Pressable style={styles.secondaryButton} onPress={handleWithdrawalSubmit}>
              <ThemedText type="default" style={styles.buttonText}>
                銀行から現金へ移動
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
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
