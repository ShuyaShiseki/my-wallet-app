import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDoc, setDoc } from 'firebase/firestore';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { walletDocRef } from '@/lib/firebase';

export type AccountType = 'bank' | 'wallet';
export type HistoryType = 'expense' | 'withdrawal';

export type WalletBalances = {
  bank: number;
  wallet: number;
};

export type WalletHistoryEntry = {
  id: string;
  type: HistoryType;
  account: AccountType;
  amount: number;
  category: string;
  createdAt: string;
};

type WalletStatePayload = {
  initialBalances?: WalletBalances;
  history?: WalletHistoryEntry[];
  updatedAt?: string;
};

type WalletContextValue = {
  initialBalances: WalletBalances;
  balances: WalletBalances;
  history: WalletHistoryEntry[];
  setInitialBalances: (bank: number, wallet: number) => void;
  addExpense: (account: AccountType, amount: number, category: string) => boolean;
  addWithdrawal: (amount: number) => boolean;
  deleteHistory: (id: string) => void;
};

const defaultBalances: WalletBalances = {
  bank: 0,
  wallet: 0,
};

const STORAGE_KEY = 'my-wallet-app-v1';

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function normalizeAmount(value: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, numericValue);
}

function normalizeWalletBalances(input?: Partial<WalletBalances>): WalletBalances {
  if (!input) {
    return { ...defaultBalances };
  }

  return {
    bank: normalizeAmount(input.bank ?? 0),
    wallet: normalizeAmount(input.wallet ?? 0),
  };
}

function calculateBalances(initial: WalletBalances, history: WalletHistoryEntry[]): WalletBalances {
  return history.reduce(
    (result, item) => {
      const amount = normalizeAmount(item.amount);
      const next = { ...result };

      if (item.type === 'expense') {
        if (item.account === 'bank') {
          next.bank = Math.max(0, result.bank - amount);
        } else {
          next.wallet = Math.max(0, result.wallet - amount);
        }
      } else {
        next.bank = Math.max(0, result.bank - amount);
        next.wallet = result.wallet + amount;
      }

      return next;
    },
    { ...initial },
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [initialBalances, setInitialBalances] = useState<WalletBalances>(defaultBalances);
  const [history, setHistory] = useState<WalletHistoryEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const balances = useMemo(
    () => calculateBalances(initialBalances, history),
    [initialBalances, history],
  );

  useEffect(() => {
    let isMounted = true;

    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as WalletStatePayload;

          if (parsed.initialBalances) {
            setInitialBalances(normalizeWalletBalances(parsed.initialBalances));
          }

          if (Array.isArray(parsed.history)) {
            setHistory(parsed.history);
          }
        }

        if (walletDocRef) {
          const snapshot = await getDoc(walletDocRef);
          if (snapshot.exists()) {
            const remote = snapshot.data() as WalletStatePayload;

            if (remote.initialBalances) {
              setInitialBalances(normalizeWalletBalances(remote.initialBalances));
            }

            if (Array.isArray(remote.history)) {
              setHistory(remote.history);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load wallet state:', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void loadState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistState = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            initialBalances,
            history,
          }),
        );
      } catch (error) {
        console.warn('Failed to save wallet state locally:', error);
      }

      if (!walletDocRef) {
        return;
      }

      try {
        await setDoc(
          walletDocRef,
          {
            initialBalances,
            history,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (error) {
        console.warn('Failed to sync wallet state to Firestore:', error);
      }
    };

    void persistState();
  }, [initialBalances, history, isHydrated]);

  const value = useMemo<WalletContextValue>(
    () => ({
      initialBalances,
      balances,
      history,
      setInitialBalances: (bank: number, wallet: number) => {
        setInitialBalances({
          bank: normalizeAmount(bank),
          wallet: normalizeAmount(wallet),
        });
      },
      addExpense: (account: AccountType, amount: number, category: string) => {
        const cleanAmount = normalizeAmount(amount);
        const cleanCategory = category.trim();

        if (!cleanCategory || cleanAmount <= 0) {
          return false;
        }

        const nextEntry: WalletHistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'expense',
          account,
          amount: cleanAmount,
          category: cleanCategory,
          createdAt: new Date().toISOString(),
        };

        setHistory((current) => [nextEntry, ...current]);
        return true;
      },
      addWithdrawal: (amount: number) => {
        const cleanAmount = normalizeAmount(amount);

        if (cleanAmount <= 0) {
          return false;
        }

        const nextEntry: WalletHistoryEntry = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: 'withdrawal',
          account: 'bank',
          amount: cleanAmount,
          category: '引き出し',
          createdAt: new Date().toISOString(),
        };

        setHistory((current) => [nextEntry, ...current]);
        return true;
      },
      deleteHistory: (id: string) => {
        setHistory((current) => current.filter((item) => item.id !== id));
      },
    }),
    [balances, history, initialBalances],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used inside WalletProvider');
  }

  return context;
}
