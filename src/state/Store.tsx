import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createSeed } from '../domain/seed';
import { execute } from '../domain/commands';
import type { Command, DemoState } from '../domain/model';

const KEY = '@voyz-friends/native-demo-v1';
interface Store {
  state: DemoState; loaded: boolean; toast: string;
  run: (command: Command, success?: string) => DemoState | null;
  reset: () => void; tell: (text: string) => void;
}
const Context = createContext<Store | null>(null);

export function StoreProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<DemoState>(() => createSeed());
  const stateRef = useRef(state);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeQueue = useRef(Promise.resolve());
  const alive = useRef(true);
  const tell = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text); toastTimer.current = setTimeout(() => setToast(''), 4000);
  }, []);
  const commit = useCallback((next: DemoState) => {
    stateRef.current = next; setState(next);
    // Serialize writes so a slow older write cannot overwrite a newer command.
    const json = JSON.stringify(next);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(KEY, json)).catch(() => { if (alive.current) tell('Не удалось сохранить изменения на устройстве.'); });
  }, [tell]);
  useEffect(() => {
    alive.current = true;
    AsyncStorage.getItem(KEY).then(raw => {
      if (!alive.current) return;
      let next = createSeed();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as DemoState;
          if (parsed.version === 1 && Array.isArray(parsed.trips) && Array.isArray(parsed.travelers) && Array.isArray(parsed.applications) && parsed.travelers.some(p => p.id === parsed.meId)) next = execute(parsed, { type: 'EXPIRE' });
          else tell('Формат демоданных изменился. Загружена новая демонстрация.');
        } catch { tell('Не удалось прочитать демоданные. Загружена новая демонстрация.'); }
      }
      stateRef.current = next; setState(next); setLoaded(true);
    }).catch(() => { if (alive.current) { setLoaded(true); tell('Хранилище недоступно. Изменения могут не сохраниться.'); } });
    return () => { alive.current = false; if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [tell]);
  const run = useCallback((command: Command, success?: string) => {
    // Persist expiry even when a subsequent stale action is rejected.
    let current = stateRef.current;
    const expired = execute(current, { type: 'EXPIRE' });
    if (expired !== current) { commit(expired); current = expired; }
    try {
      const next = execute(current, command);
      if (next !== current) commit(next);
      if (success) tell(success);
      return next;
    } catch (e) { tell(e instanceof Error ? e.message : 'Не удалось выполнить действие.'); return null; }
  }, [commit, tell]);
  useEffect(() => {
    if (!loaded) return;
    const tick = () => { const next = execute(stateRef.current, { type: 'EXPIRE' }); if (next !== stateRef.current) commit(next); };
    const timer = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', status => { if (status === 'active') tick(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [loaded, commit]);
  const reset = useCallback(() => { const next = createSeed(); next.welcomeSeen = true; commit(next); tell('Демоданные сброшены.'); }, [commit, tell]);
  return <Context.Provider value={{ state, loaded, run, reset, toast, tell }}>{children}</Context.Provider>;
}
export function useStore() { const ctx = useContext(Context); if (!ctx) throw new Error('StoreProvider missing'); return ctx; }
