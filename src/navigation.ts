import type { NavigatorScreenParams } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
export type TabParamList = { People: undefined; Trips: undefined; Plans: undefined; Messages: undefined; Profile: undefined };
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Trip: { id: string }; Person: { id: string }; Chat: { id: string }; Create: undefined;
  Demo: undefined; Notifications: undefined; Election: { id: string };
};

/** Typed application destinations, backed by Expo Router on all platforms. */
export function useVoyzNavigation() {
  const router = useRouter();
  function destination<K extends keyof RootStackParamList>(name: K, params?: RootStackParamList[K]): Href {
    if (name === 'Tabs') {
      const screen = (params as { screen?: keyof TabParamList } | undefined)?.screen || 'Trips';
      return ({ Trips: '/(tabs)', People: '/(tabs)/people', Plans: '/(tabs)/plans', Messages: '/(tabs)/messages', Profile: '/(tabs)/profile' } as const)[screen];
    }
    const simple = { Create: '/create', Demo: '/demo', Notifications: '/notifications' } as const;
    if (name in simple) return simple[name as keyof typeof simple];
    const path = ({ Trip: '/trip/[id]', Person: '/person/[id]', Chat: '/chat/[id]', Election: '/election/[id]' } as const)[name as 'Trip' | 'Person' | 'Chat' | 'Election'];
    return { pathname: path, params: { id: (params as { id: string }).id } };
  }
  return {
    navigate: <K extends keyof RootStackParamList>(name: K, params?: RootStackParamList[K]) => router.navigate(destination(name, params)),
    replace: <K extends keyof RootStackParamList>(name: K, params?: RootStackParamList[K]) => router.replace(destination(name, params)),
    canGoBack: () => router.canGoBack(),
    goBack: () => router.canGoBack() ? router.back() : router.replace('/(tabs)'),
  };
}
