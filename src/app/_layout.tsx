import React from 'react';
import '../../global.css';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from '../state/Store';
import { Button, Loading, Notice, Sheet, T } from '../components/UI';
import { colors as c } from '../theme';

function Shell() {
  const { state, loaded, run, toast } = useStore(); const insets = useSafeAreaInsets();
  if (!loaded) return <Loading />;
  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ink } }} />
    <Sheet visible={!state.welcomeSeen} title="Начнём путешествие?" onClose={() => run({ type: 'WELCOME' })}><T style={{ fontSize: 16, lineHeight: 25 }}>Voyz Friends помогает найти компанию для путешествий по Кыргызстану.</T><Notice title="Это интерактивная демонстрация">Профили и поездки вымышлены. Сообщения не отправляются людям, проверки и покупки не выполняются. Изменения сохраняются только на вашем устройстве.</Notice><Button label="Начать исследовать" onPress={() => run({ type: 'WELCOME' })} /></Sheet>
    {!!toast && <View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.toastWrap, { bottom: Math.max(insets.bottom, 12) + 90 }]}><View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View></View>}
  </>;
}
export default function RootLayout() { return <SafeAreaProvider><StoreProvider><Shell /></StoreProvider></SafeAreaProvider>; }
const styles = StyleSheet.create({ toastWrap: { position: 'absolute', left: 18, right: 18, alignItems: 'center', zIndex: 100 }, toast: { backgroundColor: c.ink, padding: 17, borderRadius: 20, maxWidth: 600, borderWidth: 1, borderColor: '#7A806E' }, toastText: { fontSize: 14, lineHeight: 21, color: c.paper, textAlign: 'center' } });
