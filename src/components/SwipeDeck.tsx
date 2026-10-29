import React, { useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, PanResponder, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { Traveler } from '../domain/model';
import { colors as c, photos } from '../theme';
import { Button, Icon, Shade, T, ui } from './UI';

const native = Platform.OS !== 'web';
const SWIPE = 0.28; // доля ширины карточки, после которой свайп засчитывается
const FLICK = 0.55; // или быстрый бросок, px/мс

type Direction = 'left' | 'right';

/**
 * Колода анкет: карточка идёт за пальцем, наклоняется и подсказывает действие.
 * Влево — пропустить, вправо — открыть форму запроса (сообщение уходит только после «Отправить»).
 */
export function SwipeDeck({ people, onSkip, onLike, onOpen }: { people: Traveler[]; onSkip: (p: Traveler) => void; onLike: (p: Traveler) => void; onOpen: (p: Traveler) => void }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(360);
  const [position] = useState(() => new Animated.ValueXY());
  const busy = useRef(false);
  const dragged = useRef(false); // после перетаскивания отпускание пальца не должно открывать анкету
  const state = useRef({ index, people, width, onSkip, onLike });
  // Обработчики жеста создаются один раз и читают свежие значения отсюда.
  useLayoutEffect(() => { state.current = { index, people, width, onSkip, onLike }; });

  const finish = (direction: Direction) => {
    const { index: i, people: list, onSkip: skip, onLike: like } = state.current; const p = list[i];
    setIndex(i + 1); position.setValue({ x: 0, y: 0 }); busy.current = false;
    if (p) (direction === 'left' ? skip : like)(p);
  };
  const fling = (direction: Direction, vy = 0) => {
    if (busy.current || !state.current.people[state.current.index]) return; busy.current = true;
    const x = (direction === 'right' ? 1 : -1) * state.current.width * 1.5;
    Animated.timing(position, { toValue: { x, y: vy * 120 }, duration: 230, easing: Easing.out(Easing.quad), useNativeDriver: native }).start(() => finish(direction));
  };
  const springBack = () => Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: native }).start();

  // Обработчики читают ref только во время жеста, не при отрисовке; PanResponder создаётся один раз.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    // Ловим только горизонтальное движение — вертикальная прокрутка экрана остаётся живой.
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { dragged.current = true; position.stopAnimation(); },
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.25 }),
    onPanResponderRelease: (_, g) => {
      setTimeout(() => { dragged.current = false; }, 80);
      const limit = state.current.width * SWIPE;
      if (g.dx > limit || g.vx > FLICK) fling('right', g.vy);
      else if (g.dx < -limit || g.vx < -FLICK) fling('left', g.vy);
      else springBack();
    },
    onPanResponderTerminate: () => { dragged.current = false; springBack(); },
  }));

  const current = people[index], upcoming = people[index + 1];
  if (!current) return <View style={styles.done}><Icon name="sparkles-outline" size={34} /><T style={{ fontSize: 20, fontWeight: '500' }}>Вы посмотрели всех</T><T style={[ui.copy, { textAlign: 'center' }]}>Новые люди появятся, когда включат «Ищу компанию». Можно пройтись ещё раз или поменять фильтры.</T><Button label="Начать сначала" variant="secondary" onPress={() => setIndex(0)} /></View>;

  const w = width;
  const rotate = position.x.interpolate({ inputRange: [-w, 0, w], outputRange: ['-14deg', '0deg', '14deg'] });
  const likeOpacity = position.x.interpolate({ inputRange: [w * .05, w * SWIPE], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = position.x.interpolate({ inputRange: [-w * SWIPE, -w * .05], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = position.x.interpolate({ inputRange: [-w * SWIPE, 0, w * SWIPE], outputRange: [1, .94, 1], extrapolate: 'clamp' });
  const nextLift = position.x.interpolate({ inputRange: [-w * SWIPE, 0, w * SWIPE], outputRange: [0, 16, 0], extrapolate: 'clamp' });
  const press = (direction: Direction) => { AccessibilityInfo.announceForAccessibility?.(direction === 'left' ? 'Пропущено' : 'Открываем запрос'); fling(direction); };

  return <View>
    <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {upcoming && <Animated.View pointerEvents="none" style={[styles.card, { transform: [{ translateY: nextLift }, { scale: nextScale }] }]}><Face person={upcoming} /></Animated.View>}
      <Animated.View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel={`${current.name}, ${current.age}. ${current.city}. ${current.plan}`} accessibilityHint="Смахните влево, чтобы пропустить, вправо — чтобы предложить познакомиться"
        accessibilityActions={[{ name: 'decrement', label: 'Пропустить' }, { name: 'increment', label: 'Познакомиться' }, { name: 'activate', label: 'Открыть анкету' }]}
        onAccessibilityAction={e => e.nativeEvent.actionName === 'decrement' ? press('left') : e.nativeEvent.actionName === 'increment' ? press('right') : onOpen(current)}
        style={[styles.card, styles.top, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!dragged.current) onOpen(current); }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Face person={current} /></Pressable>
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.like, { opacity: likeOpacity }]}><Text style={styles.stampText}>ЗНАКОМСТВО</Text></Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.skip, { opacity: skipOpacity }]}><Text style={[styles.stampText, { color: c.paper }]}>ПРОПУСК</Text></Animated.View>
      </Animated.View>
    </View>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Пропустить" onPress={() => press('left')} style={({ pressed }) => [styles.round, styles.roundSkip, pressed && styles.pressed]}><Icon name="close" size={30} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Открыть анкету" onPress={() => onOpen(current)} style={({ pressed }) => [styles.round, styles.roundSmall, pressed && styles.pressed]}><Icon name="person-outline" size={22} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Предложить познакомиться" onPress={() => press('right')} style={({ pressed }) => [styles.round, styles.roundLike, pressed && styles.pressed]}><Icon name="chatbubble-ellipses-outline" size={28} /></Pressable>
    </View>
    <T style={styles.hint}>{index + 1} из {people.length} · влево — пропустить, вправо — познакомиться</T>
  </View>;
}

function Face({ person }: { person: Traveler }) {
  return <View style={StyleSheet.absoluteFill}>
    <Image source={photos[person.photo] || photos.mountain} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
    <Shade />
    <View style={styles.badge}><T style={{ fontSize: 12 }}>Ищу компанию</T></View>
    <View style={styles.info}>
      <Text style={styles.name}>{person.name}, {person.age}</Text>
      <Text style={styles.meta}>{person.city}</Text>
      <Text style={styles.plan} numberOfLines={2}>{person.plan}</Text>
      <View style={[ui.wrap, { marginTop: 4 }]}>{person.interests.slice(0, 3).map(x => <View key={x} style={styles.chip}><Text style={styles.chipText}>{x}</Text></View>)}<View style={styles.chip}><Text style={styles.chipText}>{person.languages.join(' · ')}</Text></View></View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  stage: { height: 500, width: '100%', maxWidth: 440, alignSelf: 'center' },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, overflow: 'hidden', backgroundColor: '#3B4837' },
  top: { shadowColor: '#000', shadowOpacity: .22, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6, ...(Platform.OS === 'web' ? { cursor: 'grab', userSelect: 'none', touchAction: 'pan-y' } as object : {}) },
  badge: { position: 'absolute', top: 16, left: 16, backgroundColor: c.lime, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6 },
  info: { position: 'absolute', left: 20, right: 20, bottom: 22, gap: 3 },
  name: { color: c.paper, fontSize: 32, fontWeight: '600', letterSpacing: -1 },
  meta: { color: '#E7EADF', fontSize: 14 },
  plan: { color: c.paper, fontSize: 16, lineHeight: 22, marginTop: 4 },
  chip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFFFFF26', borderWidth: 1, borderColor: '#FFFFFF55' },
  chipText: { color: c.paper, fontSize: 12 },
  stamp: { position: 'absolute', top: 34, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 3 },
  like: { left: 22, borderColor: c.lime, backgroundColor: c.lime, transform: [{ rotate: '-10deg' }] },
  skip: { right: 22, borderColor: c.paper, backgroundColor: '#00000066', transform: [{ rotate: '10deg' }] },
  stampText: { fontSize: 22, fontWeight: '800', letterSpacing: 1, color: c.ink },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 22 },
  round: { alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: c.paper, borderWidth: 1.5, borderColor: c.line },
  roundSkip: { width: 66, height: 66 },
  roundSmall: { width: 50, height: 50, backgroundColor: c.soft },
  roundLike: { width: 74, height: 74, backgroundColor: c.lime, borderColor: c.lime },
  pressed: { transform: [{ scale: .92 }] },
  hint: { textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 14 },
  done: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 20, borderRadius: 28, backgroundColor: c.soft },
});
