import { useVoyzNavigation } from '../navigation';
import React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c, photos } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export const Icon = ({ name, size = 22, color = c.ink }: { name: IconName; size?: number; color?: string }) => <Ionicons name={name} size={size} color={color} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden />;
export const T = ({ children, style }: React.PropsWithChildren<{ style?: StyleProp<import('react-native').TextStyle> }>) => <Text style={[ui.text, style]}>{children}</Text>;
export function Button({ label, onPress, variant = 'primary', icon, disabled, style }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'outline' | 'danger'; icon?: IconName; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.button, variant === 'primary' ? ui.primary : variant === 'secondary' ? ui.secondary : variant === 'danger' ? ui.danger : ui.outline, style, { opacity: disabled ? .45 : pressed ? .7 : 1 }]}>{icon && <Icon name={icon} color={variant === 'danger' ? c.error : c.ink} />}<Text style={[ui.buttonText, variant === 'danger' && { color: c.error }]}>{label}</Text></Pressable>;
}
export function IconButton({ name, onPress, label, dark, lime }: { name: IconName; onPress: () => void; label: string; dark?: boolean; lime?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [ui.iconButton, { backgroundColor: lime ? c.lime : dark ? '#181B14' : c.paper, borderColor: dark ? '#45483E' : c.line, opacity: pressed ? .65 : 1 }]}><Icon name={name} color={dark && !lime ? c.paper : c.ink} /></Pressable>;
}
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ selected }} style={({ pressed }) => [ui.chip, selected && ui.chipSelected, { opacity: pressed ? .7 : 1 }]}><T style={{ fontSize: 13, color: selected ? c.paper : c.ink }}>{label}</T></Pressable>;
}
export function Tag({ label, lime = false }: { label: string; lime?: boolean }) { return <View style={[ui.tag, { backgroundColor: lime ? c.lime : c.soft }]}><T style={{ fontSize: 12 }}>{label}</T></View>; }
export function Notice({ title, children, lime = false, error = false }: React.PropsWithChildren<{ title?: string; lime?: boolean; error?: boolean }>) {
  return <View style={[ui.notice, { backgroundColor: error ? '#FFF0ED' : lime ? '#F2FFCE' : c.soft }]}>{title && <T style={{ fontWeight: '600', marginBottom: 5, color: error ? c.error : c.ink }}>{title}</T>}{typeof children === 'string' ? <T style={{ fontSize: 14, lineHeight: 21, color: error ? c.error : c.muted }}>{children}</T> : children}</View>;
}
export function Field({ label, value, onChange, placeholder, multiline, numeric, secure = false, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean; numeric?: boolean; secure?: boolean; hint?: string }) {
  return <View style={{ marginVertical: 10 }}><T style={ui.label}>{label}</T><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#73796B" multiline={multiline} keyboardType={numeric ? 'numeric' : 'default'} secureTextEntry={secure} style={[ui.input, multiline && { minHeight: 112, textAlignVertical: 'top' }]} autoCapitalize={numeric ? 'none' : 'sentences'} maxLength={multiline ? 3000 : 250} />{hint && <T style={ui.hint}>{hint}</T>}</View>;
}
export function Check({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked }} style={ui.check}><View style={[ui.checkBox, checked && { backgroundColor: c.ink, borderColor: c.ink }]}>{checked && <Icon name="checkmark" size={18} color={c.lime} />}</View><T style={{ flex: 1, fontSize: 14, lineHeight: 21 }}>{label}</T></Pressable>;
}
export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={ui.sectionTitle}><Text style={ui.h2}>{title}</Text>{action && <Pressable onPress={onPress} accessibilityRole="button" style={ui.textAction}><T style={{ fontSize: 13 }}>{action}</T><Icon name="arrow-forward" size={18} /></Pressable>}</View>;
}
export function Screen({ title, subtitle, back, children, search, onSearch, searchPlaceholder, filter, headerRight, scroll = true }: React.PropsWithChildren<{ title: string; subtitle?: string; back?: boolean; search?: string; onSearch?: (s: string) => void; searchPlaceholder?: string; filter?: () => void; headerRight?: React.ReactNode; scroll?: boolean }>) {
  const insets = useSafeAreaInsets();
  const navigation = useVoyzNavigation();
  const header = <View style={[ui.header, { paddingTop: insets.top + 12 }]}>
    <View style={ui.topRow}>{back ? <IconButton name="arrow-back" label="Назад" dark onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Tabs', { screen: 'Trips' })} /> : <View><Text style={ui.wordmark}>VOYZ</Text><Text style={ui.wordmarkSub}>friends</Text></View>}<View style={ui.location}><Icon name="location-outline" size={17} color={c.paper} /><T style={{ fontSize: 12, color: c.paper }}>Кыргызстан</T></View><View style={ui.row}>{headerRight || <><IconButton name="notifications-outline" label="Уведомления" dark onPress={() => navigation.navigate('Notifications')} /><IconButton name="add" label="Создать поездку" lime onPress={() => navigation.navigate('Create')} /></>}</View></View>
    <Text style={[ui.h1, back && { fontSize: 29 }]}>{title}</Text>{subtitle && <T style={ui.subtitle}>{subtitle}</T>}
    {onSearch && <View style={[ui.row, { marginTop: 22 }]}><View style={ui.search}><Icon name="search-outline" color={c.paper} /><TextInput accessibilityLabel="Поиск" placeholder={searchPlaceholder || 'Куда отправимся вместе?'} placeholderTextColor="#B8BCB0" value={search} onChangeText={onSearch} style={ui.searchInput} returnKeyType="search" /></View><IconButton name="options-outline" label="Открыть фильтры" onPress={filter || (() => {})} lime /></View>}
  </View>;
  const body = <View style={[ui.sheet, { paddingBottom: Math.max(insets.bottom, 16) + (back ? 24 : 110) }]}>{children}</View>;
  return <View style={ui.screen}><View style={ui.frame}>{scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>{header}{body}</ScrollView> : <>{header}{body}</>}</View></View>;
}
export function Sheet({ visible, title, onClose, children }: React.PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent><KeyboardAvoidingView style={ui.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><Pressable accessibilityLabel="Закрыть окно" onPress={onClose} style={StyleSheet.absoluteFill} /><View accessibilityViewIsModal style={[ui.modal, { paddingBottom: Math.max(insets.bottom, 20), marginTop: insets.top + 24 }]}><View style={ui.modalHeader}><Text style={ui.h2}>{title}</Text><IconButton name="close" label="Закрыть" onPress={onClose} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20 }}><View style={{ gap: 12 }}>{children}</View></ScrollView></View></KeyboardAvoidingView></Modal>;
}
export function Confirm({ visible, title, text, onClose, onConfirm, label = 'Подтвердить' }: { visible: boolean; title: string; text: string; onClose: () => void; onConfirm: () => void; label?: string }) {
  return <Sheet visible={visible} title={title} onClose={onClose}><T style={ui.copy}>{text}</T><Button label={label} onPress={onConfirm} /><Button label="Отмена" onPress={onClose} variant="secondary" /></Sheet>;
}
export function Empty({ title, text, children }: React.PropsWithChildren<{ title: string; text: string }>) { return <View style={ui.empty}><Icon name="search-outline" size={38} color={c.muted} /><Text style={[ui.h2, { textAlign: 'center' }]}>{title}</Text><T style={{ color: c.muted, textAlign: 'center', lineHeight: 23 }}>{text}</T>{children}</View>; }
export function Avatar({ photo, size = 48 }: { photo: string; size?: number }) { return <Image source={photos[photo] || photos.alex} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityIgnoresInvertColors />; }
export function Photo({ name, style }: { name: string; style?: StyleProp<import('react-native').ImageStyle> }) { return <Image source={photos[name] || photos.mountain} style={style} resizeMode="cover" accessibilityIgnoresInvertColors />; }
export function Footer() { return <T style={ui.footer}>Демонстрационные профили, поездки и фотографии. Сообщения и покупки никуда не отправляются.</T>; }
export function ExternalSheet({ type, onClose }: { type: string | null; onClose: () => void }) {
  const title = ({ tour: 'Авторский тур Voyz', guide: 'Место в Voyz Guide', stay: 'Проживание', account: 'Общий аккаунт Voyz' } as Record<string, string>)[type || ''] || 'Экосистема Voyz';
  return <Sheet visible={!!type} title={title} onClose={onClose}><Notice title="Будущая интеграция">Общие аккаунты, каталог, бронирования и переписку подключат программисты. Сейчас приложение работает с локальными данными.</Notice><T style={ui.copy}>План поездки, участие в компании и коммерческое бронирование — разные действия. Нажатие этой кнопки не создаёт заказ и не списывает деньги.</T><Button label="Понятно" onPress={onClose} /></Sheet>;
}
export function Loading() { return <View style={ui.loading}><ActivityIndicator color={c.lime} size="large" /><T style={{ color: c.paper }}>Открываем Voyz Friends…</T></View>; }
export const Shade = () => <LinearGradient colors={['transparent', '#00000030', '#000000D9']} style={StyleSheet.absoluteFill} />;

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink }, frame: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  text: { fontSize: 16, color: c.ink }, copy: { fontSize: 15, lineHeight: 24, color: c.muted }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  header: { backgroundColor: c.ink, paddingHorizontal: 22, paddingBottom: 28 }, topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 26 },
  wordmark: { fontSize: 25, fontWeight: '900', color: c.paper, letterSpacing: -1.5 }, wordmarkSub: { fontSize: 10, letterSpacing: 1.5, color: c.paper }, location: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  h1: { fontSize: 38, fontWeight: '500', letterSpacing: -1.5, lineHeight: 41, color: c.paper }, h2: { fontSize: 24, fontWeight: '500', letterSpacing: -.6, color: c.ink, flexShrink: 1 },
  subtitle: { color: c.onDark, fontSize: 14, lineHeight: 21, marginTop: 12 }, sheet: { flexGrow: 1, backgroundColor: c.paper, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 18 },
  button: { minHeight: 50, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, buttonText: { color: c.ink, fontSize: 15, fontWeight: '500', textAlign: 'center', flexShrink: 1 }, primary: { backgroundColor: c.lime }, secondary: { backgroundColor: c.soft }, outline: { borderWidth: 1, borderColor: '#B8C0AA', backgroundColor: c.paper }, danger: { backgroundColor: '#FFF0ED' },
  iconButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  chip: { minHeight: 46, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: c.line, borderRadius: 26, justifyContent: 'center', alignItems: 'center' }, chipSelected: { backgroundColor: c.ink, borderColor: c.ink }, tag: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 22, alignSelf: 'flex-start' },
  notice: { borderRadius: 20, padding: 17, gap: 4 }, sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, textAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 14, marginBottom: 9, fontWeight: '500' }, input: { borderWidth: 1, borderColor: '#B9C1AD', borderRadius: 16, minHeight: 52, paddingVertical: 14, paddingHorizontal: 15, color: c.ink, fontSize: 16, backgroundColor: c.paper }, hint: { fontSize: 12, lineHeight: 19, color: c.muted, marginTop: 7 }, search: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#A7AE9C', paddingVertical: 8 }, searchInput: { color: c.paper, fontSize: 16, flex: 1, minHeight: 44, paddingVertical: 8 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 8 }, checkBox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#7B856C', justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end', alignItems: 'center' }, modal: { backgroundColor: c.paper, width: '100%', maxWidth: 620, maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 22 },
  empty: { gap: 18, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 14 }, footer: { borderTopWidth: 1, borderTopColor: c.line, marginTop: 14, paddingTop: 18, color: c.muted, fontSize: 12, lineHeight: 19 }, loading: { flex: 1, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', gap: 22 },
});
