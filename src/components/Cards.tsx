import { useVoyzNavigation } from '../navigation';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Traveler, Trip } from '../domain/model';
import { available, budgetText, datesText, members, traveler } from '../domain/selectors';
import { useStore } from '../state/Store';
import { colors as c, photos } from '../theme';
import { Avatar, Icon, Photo, Shade, T, Tag, ui } from './UI';

export function TripCard({ trip, tall = false }: { trip: Trip; tall?: boolean }) {
  const navigation = useVoyzNavigation(); const { state, run } = useStore(); const saved = state.saved.includes(trip.id);
  const ids = [trip.hostId, ...members(state, trip.id).slice(0, 2).map(a => a.userId)].filter(Boolean) as string[];
  return <View style={[styles.card, { height: tall ? 428 : 208 }]}><Pressable accessibilityRole="button" accessibilityLabel={`Открыть поездку: ${trip.title}`} onPress={() => navigation.navigate('Trip', { id: trip.id })} style={StyleSheet.absoluteFill}>
    <Photo name={trip.photo} style={StyleSheet.absoluteFill} /><Shade /><View style={styles.top}><Tag label={trip.commercial ? 'Тур Voyz' : `${available(state, trip)} места`} lime={!trip.commercial} /></View>
    <View style={styles.bottom}><T style={styles.date}>{datesText(trip)}</T><Text numberOfLines={tall ? 4 : 3} style={[styles.title, { fontSize: tall ? 29 : 19 }]}>{trip.title}</Text><T style={styles.meta}>{trip.duration} дн. · {budgetText(trip.budget)}</T>{tall && <View style={styles.avatars}>{ids.map(id => <View key={id} style={styles.avatar}><Avatar photo={traveler(state, id)?.photo || 'alex'} size={26} /></View>)}</View>}</View>
  </Pressable><Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Убрать из сохранённых' : 'Сохранить поездку'} accessibilityState={{ selected: saved }} onPress={() => run({ type: 'SAVE', tripId: trip.id })} style={styles.save}><Icon name={saved ? 'heart' : 'heart-outline'} color={saved ? c.lime : c.paper} /></Pressable></View>;
}
export function PersonCard({ person, large = false }: { person: Traveler; large?: boolean }) {
  const navigation = useVoyzNavigation();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Анкета: ${person.name}, ${person.age}`} onPress={() => navigation.navigate('Person', { id: person.id })} style={[styles.person, large && { width: '100%' }]}><Image source={photos[person.photo]} resizeMode="cover" style={{ height: large ? 360 : 224, width: '100%' }} accessibilityIgnoresInvertColors /><View style={styles.personTag}><Tag label="Ищу компанию" lime /></View><View style={{ padding: 14, gap: 6 }}><Text style={styles.personName}>{person.name}, {person.age}</Text><T style={styles.personMeta}>{person.city}</T><T style={styles.personMeta}>{person.plan}</T><View style={[ui.wrap, { marginTop: 5 }]}>{person.interests.map(x => <View key={x} style={styles.interest}><T style={{ fontSize: 11 }}>{x}</T></View>)}</View></View></Pressable>;
}
export function TripRow({ trip, label, onPress }: { trip: Trip; label?: string; onPress?: () => void }) {
  const navigation = useVoyzNavigation();
  return <Pressable accessibilityRole="button" onPress={onPress || (() => navigation.navigate('Trip', { id: trip.id }))} style={styles.tripRow}><Photo name={trip.photo} style={{ width: 80, height: 112, borderRadius: 17 }} /><View style={{ flex: 1, gap: 6 }}><Tag label={label || (trip.commercial ? 'Авторский тур' : 'Самостоятельная')} /><T style={{ fontWeight: '500', fontSize: 18 }}>{trip.title}</T><T style={styles.personMeta}>{datesText(trip)}</T><T style={styles.personMeta}>{budgetText(trip.budget)}</T></View><Icon name="chevron-forward" size={18} /></Pressable>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 25, overflow: 'hidden', backgroundColor: '#3B4837' }, top: { position: 'absolute', left: 11, top: 13, right: 52 }, bottom: { position: 'absolute', left: 15, right: 12, bottom: 18, gap: 7 },
  date: { color: '#F2F3EB', fontSize: 11, lineHeight: 15 }, title: { color: c.paper, fontWeight: '500', letterSpacing: -.6, lineHeight: undefined }, meta: { color: '#F2F3EB', fontSize: 12, lineHeight: 17 },
  save: { position: 'absolute', right: 8, top: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: '#00000055', borderWidth: 1, borderColor: '#FFFFFF88', alignItems: 'center', justifyContent: 'center' },
  avatars: { flexDirection: 'row', marginTop: 8, paddingLeft: 3 }, avatar: { marginLeft: -3, borderRadius: 17, borderWidth: 2, borderColor: c.paper },
  person: { width: '48%', borderRadius: 24, overflow: 'hidden', backgroundColor: c.soft }, personTag: { position: 'absolute', top: 12, left: 10 }, personName: { fontSize: 19, fontWeight: '500', letterSpacing: -.4 }, personMeta: { fontSize: 12, lineHeight: 18, color: c.muted }, interest: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#CFD6C4' },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12, borderWidth: 1, borderColor: c.line, borderRadius: 24, backgroundColor: c.paper },
});
