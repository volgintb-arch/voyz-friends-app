import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../../components/UI';
import { colors as c } from '../../theme';
const tabs: Record<string, { label: string; icon: IconName }> = { index: { label: 'Поездки', icon: 'trail-sign-outline' }, people: { label: 'Люди', icon: 'people-outline' }, plans: { label: 'Мои планы', icon: 'calendar-outline' }, messages: { label: 'Сообщения', icon: 'chatbubble-ellipses-outline' }, profile: { label: 'Профиль', icon: 'person-outline' } };
export const unstable_settings = { initialRouteName: 'index' };
function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = [...state.routes].sort((a, b) => ['people', 'index', 'plans', 'messages', 'profile'].indexOf(a.name) - ['people', 'index', 'plans', 'messages', 'profile'].indexOf(b.name));
  return <View pointerEvents="box-none" style={[styles.tabWrap, { bottom: Math.max(insets.bottom, 10) }]}><View style={styles.tabBar}>{routes.map(route => { const focused = state.routes[state.index]?.key === route.key, item = tabs[route.name]; if (!item) return null;
    return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: focused }} onPress={() => { const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) navigateToTab(route.key); }} onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })} style={({ pressed }) => [styles.tab, focused && { backgroundColor: c.lime }, { opacity: pressed ? .6 : 1 }]}><Icon name={item.icon} size={22} color={focused ? c.ink : '#59604E'} /><Text style={[styles.tabLabel, { color: focused ? c.ink : '#59604E' }]}>{item.label}</Text></Pressable>;
  })}</View></View>;
}
export default function TabsLayout() { return <Tabs screenOptions={{ headerShown: false, animation: 'none', sceneStyle: { backgroundColor: c.ink } }} tabBar={props => <TabBar {...props} />}><Tabs.Screen name="people" /><Tabs.Screen name="index" /><Tabs.Screen name="plans" /><Tabs.Screen name="messages" /><Tabs.Screen name="profile" /></Tabs>; }
const styles = StyleSheet.create({ tabWrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center' }, tabBar: { width: '100%', maxWidth: 500, borderRadius: 38, borderWidth: 1, borderColor: '#D7DECA', backgroundColor: '#FFFFFFF5', padding: 6, flexDirection: 'row', gap: 2, boxShadow: '0px 5px 22px #00000012' }, tab: { flex: 1, minHeight: 58, borderRadius: 30, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 1, paddingVertical: 7, gap: 4 }, tabLabel: { fontSize: 10, textAlign: 'center', flexShrink: 1 } });
