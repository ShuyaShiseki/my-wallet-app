import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWallet } from '@/context/wallet-context';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (isoString: string) =>
  new Date(isoString).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function HistoryScreen() {
  const { history, deleteHistory } = useWallet();

  const totalExpense = history
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalWithdrawal = history
    .filter((item) => item.type === 'withdrawal')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalDeposit = history
    .filter((item) => item.type === 'deposit')
    .reduce((sum, item) => sum + item.amount, 0);

  const thisMonthExpense = history.reduce((sum, item) => {
    if (item.type !== 'expense') {
      return sum;
    }

    const created = new Date(item.createdAt);
    const now = new Date();

    if (created.getFullYear() !== now.getFullYear() || created.getMonth() !== now.getMonth()) {
      return sum;
    }

    return sum + item.amount;
  }, 0);

  const summary = [
    { label: '支出合計', value: formatMoney(totalExpense) },
    { label: '引出合計', value: formatMoney(totalWithdrawal) },
    { label: '預入合計', value: formatMoney(totalDeposit) },
    { label: '今月', value: formatMoney(thisMonthExpense) },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            履歴
          </ThemedText>

          <View style={styles.summaryGrid}>
            {summary.map((item) => (
              <ThemedView key={item.label} type="backgroundElement" style={styles.summaryCard}>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.label}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.summaryValue}>
                  {item.value}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          {history.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="default">まだ履歴はありません。</ThemedText>
            </ThemedView>
          ) : (
            history.map((item) => {
              const isExpense = item.type === 'expense';
              const isDeposit = item.type === 'deposit';
              const amountColor = isExpense ? '#dc2626' : '#f59e0b';
              const amountPrefix = isExpense ? '-' : '+';

              return (
                <ThemedView key={item.id} type="backgroundElement" style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.typeWrap}>
                      <View
                        style={[
                          styles.typeBadge,
                          isExpense ? styles.typeBadgeExpense : styles.typeBadgeWithdrawal,
                        ]}>
                        <ThemedText type="smallBold" style={styles.typeBadgeText}>
                          {isExpense ? '支出' : isDeposit ? '預け入れ' : '引き出し'}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.account === 'bank' ? '銀行' : '財布'}
                      </ThemedText>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.deleteButtonPressed,
                      ]}
                      onPress={() =>
                        Alert.alert(
                          `${item.category}を削除しますか？`,
                          `金額: ${formatMoney(item.amount)}`,
                          [
                            { text: 'キャンセル', style: 'cancel' },
                            {
                              text: '削除',
                              style: 'destructive',
                              onPress: () => deleteHistory(item.id),
                            },
                          ],
                        )
                      }>
                      <ThemedText type="small" style={styles.deleteText}>
                        削除
                      </ThemedText>
                    </Pressable>
                  </View>

                  <ThemedText type="subtitle" style={styles.itemTitle}>
                    {item.category}
                  </ThemedText>

                  <View style={styles.metaRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDate(item.createdAt)}
                    </ThemedText>
                  </View>

                  <ThemedText type="title" style={[styles.amountText, { color: amountColor }]}>
                    {amountPrefix}
                    {formatMoney(item.amount)}
                  </ThemedText>
                </ThemedView>
              );
            })
          )}
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
  content: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginTop: Spacing.one,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  summaryValue: {
    fontSize: 18,
  },
  emptyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  historyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  typeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  typeBadgeExpense: {
    backgroundColor: '#fee2e2',
  },
  typeBadgeWithdrawal: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
    color: '#111827',
  },
  itemTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  amountText: {
    fontSize: 28,
    lineHeight: 34,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  deleteText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  deleteButtonPressed: {
    opacity: 0.65,
  },
});
