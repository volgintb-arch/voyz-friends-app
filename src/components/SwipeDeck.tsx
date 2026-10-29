import React, { useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { Traveler } from '../domain/model';
import { colors as c, photos } from '../theme';
import { Button, Icon, Shade, T, ui } from './UI';

const SWIPE = 0.3;   // доля ширины карточки, после которой свайп засчитывается
const FLICK = 450;   // или бросок быстрее, точек в секунду
const OUT = 1.6;     // насколько далеко улетает карточка, в ширинах
const SPRING = { damping: 16, stiffness: 180, mass: .9 };

type Direction = -1 | 1;

/**
 * Колода анкет в духе Tinder: жест и анимация идут на UI-потоке (gesture-handler + reanimated),
 * карточка следует за пальцем, наклоняется, улетает по инерции, следующая подъезжает снизу.
 * Влево — пропустить, вправо — открыть форму запроса (сообщение уходит только после «Отправить»).
 */
export function SwipeDeck({ people, onSkip, onLike, onOpen }: { people: Traveler[]; onSkip: (p: Traveler) => void; onLike: (p: Traveler) => void; onOpen: (p: Traveler) => void }) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(360);
  const tx = useSharedValue(0), ty = useSharedValue(0), w = useSharedValue(360), flying = useSharedValue(false);
  // Собственная оценка скорости: на вебе и при редких событиях velocityX бывает 0 или NaN.
  const lastX = useSharedValue(0), lastT = useSharedValue(0), speed = useSharedValue(0);
  const latest = useRef({ index, people, onSkip, onLike, onOpen });
  useLayoutEffect(() => { latest.current = { index, people, onSkip, onLike, onOpen }; });
  // Новая верхняя карточка встаёт в центр уже после того, как старая улетела.
  useLayoutEffect(() => { tx.set(0); ty.set(0); flying.set(false); }, [index, tx, ty, flying]);

  const done = (direction: Direction) => {
    const { index: i, people: list, onSkip: skip, onLike: like } = latest.current; const p = list[i];
    setIndex(i + 1); if (p) (direction < 0 ? skip : like)(p);
  };
  const open = () => { const { index: i, people: list, onOpen: show } = latest.current; if (list[i]) show(list[i]); };

  const fling = (direction: Direction, vx = 0, vy = 0) => {
    'worklet';
    if (flying.get()) return; flying.set(true);
    // На вебе при очень быстрых событиях скорость бывает NaN — без защиты длительность анимации тоже станет NaN.
    if (!Number.isFinite(vx)) vx = 0; if (!Number.isFinite(vy)) vy = 0;
    const duration = Math.max(170, 300 - Math.min(Math.abs(vx), 3000) / 25);
    ty.set(withTiming(ty.get() + vy * .12, { duration }));
    tx.set(withTiming(direction * w.get() * OUT, { duration, easing: Easing.out(Easing.cubic) }, finished => { if (finished) scheduleOnRN(done, direction); }));
  };

  const pan = usePanGesture({
    activeOffsetX: [-8, 8], failOffsetY: [-22, 22], // горизонталь — колоде, вертикаль — прокрутке экрана
    onBegin: () => { 'worklet'; lastX.set(0); lastT.set(Date.now()); speed.set(0); },
    onUpdate: e => {
      'worklet';
      if (flying.get()) return;
      const now = Date.now(), dt = now - lastT.get();
      if (dt > 0) speed.set(.7 * ((e.translationX - lastX.get()) / dt) * 1000 + .3 * speed.get());
      lastX.set(e.translationX); lastT.set(now);
      tx.set(e.translationX); ty.set(e.translationY * .35);
    },
    onDeactivate: e => {
      'worklet';
      if (flying.get()) return;
      const limit = w.get() * SWIPE, own = speed.get(), lib = Number.isFinite(e.velocityX) ? e.velocityX : 0;
      const vx = Math.abs(lib) > Math.abs(own) ? lib : own;
      const dx = Math.abs(e.translationX) > Math.abs(tx.get()) ? e.translationX : tx.get();
      // Как в Tinder: засчитывается либо далёкий увод, либо короткий быстрый бросок в ту же сторону.
      if (dx > limit || (vx > FLICK && dx > 24)) fling(1, vx, e.velocityY);
      else if (dx < -limit || (vx < -FLICK && dx < -24)) fling(-1, vx, e.velocityY);
      else { tx.set(withSpring(0, SPRING)); ty.set(withSpring(0, SPRING)); }
    },
  });
  const tap = useTapGesture({ onActivate: () => { 'worklet'; if (!flying.get()) scheduleOnRN(open); } });
  const gesture = useCompetingGestures(pan, tap);

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }, { translateY: ty.get() }, { rotate: `${interpolate(tx.get(), [-w.get(), 0, w.get()], [-16, 0, 16])}deg` }],
  }));
  const likeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.get(), [w.get() * .06, w.get() * SWIPE], [0, 1], Extrapolation.CLAMP) }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.get(), [-w.get() * SWIPE, -w.get() * .06], [1, 0], Extrapolation.CLAMP) }));
  const nextStyle = useAnimatedStyle(() => {
    const p = interpolate(Math.abs(tx.get()), [0, w.get() * SWIPE], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY: 18 * (1 - p) }, { scale: .92 + .08 * p }], opacity: .75 + .25 * p };
  });

  const current = people[index], upcoming = people[index + 1];
  if (!current) return <View style={styles.done}><Icon name="sparkles-outline" size={34} /><T style={{ fontSize: 20, fontWeight: '500' }}>Вы посмотрели всех</T><T style={[ui.copy, { textAlign: 'center' }]}>Новые люди появятся, когда включат «Ищу компанию». Можно пройтись ещё раз или поменять фильтры.</T><Button label="Начать сначала" variant="secondary" onPress={() => setIndex(0)} /></View>;

  const press = (direction: Direction) => { AccessibilityInfo.announceForAccessibility?.(direction < 0 ? 'Пропущено' : 'Открываем запрос'); fling(direction, direction * 1200); };

  return <View>
    <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => { const size = e.nativeEvent.layout.width; setWidth(size); w.set(size); }}>
      {upcoming && <Animated.View key={upcoming.id + ':next'} pointerEvents="none" style={[styles.card, nextStyle]}><Face person={upcoming} /></Animated.View>}
      <GestureDetector gesture={gesture} touchAction="pan-y" userSelect="none">
        <Animated.View key={current.id} accessible accessibilityRole="adjustable" accessibilityLabel={`${current.name}, ${current.age}. ${current.city}. ${current.plan}`} accessibilityHint="Смахните влево, чтобы пропустить, вправо — чтобы предложить познакомиться"
          accessibilityActions={[{ name: 'decrement', label: 'Пропустить' }, { name: 'increment', label: 'Познакомиться' }, { name: 'activate', label: 'Открыть анкету' }]}
          onAccessibilityAction={e => e.nativeEvent.actionName === 'decrement' ? press(-1) : e.nativeEvent.actionName === 'increment' ? press(1) : open()}
          style={[styles.card, styles.top, topStyle]}>
          <Face person={current} />
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.like, likeStyle]}><Text style={styles.stampText}>ЗНАКОМСТВО</Text></Animated.View>
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.skip, skipStyle]}><Text style={[styles.stampText, { color: c.paper }]}>ПРОПУСК</Text></Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
    <View style={styles.actions}>
      <Round label="Пропустить" icon="close" size={64} onPress={() => press(-1)} />
      <Round label="Открыть анкету" icon="information" size={48} soft onPress={open} />
      <Round label="Предложить познакомиться" icon="chatbubble-ellipses" size={72} lime onPress={() => press(1)} />
    </View>
    <T style={styles.hint}>{index + 1} из {people.length} · {width < 380 ? 'смахните карточку' : 'перетащите карточку влево или вправо'}</T>
  </View>;
}

function Round({ label, icon, size, lime, soft, onPress }: { label: string; icon: React.ComponentProps<typeof Icon>['name']; size: number; lime?: boolean; soft?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}
    style={({ pressed }) => [styles.round, { width: size, height: size, borderRadius: size / 2 }, lime && styles.roundLime, soft && styles.roundSoft, { transform: [{ scale: pressed ? .88 : 1 }] }]}>
    <Icon name={icon} size={Math.round(size * .42)} color={c.ink} />
  </Pressable>;
}

function Face({ person }: { person: Traveler }) {
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">
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
  top: { shadowColor: '#000', shadowOpacity: .25, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  badge: { position: 'absolute', top: 16, left: 16, backgroundColor: c.lime, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6 },
  info: { position: 'absolute', left: 20, right: 20, bottom: 22, gap: 3 },
  name: { color: c.paper, fontSize: 32, fontWeight: '600', letterSpacing: -1 },
  meta: { color: '#E7EADF', fontSize: 14 },
  plan: { color: c.paper, fontSize: 16, lineHeight: 22, marginTop: 4 },
  chip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFFFFF26', borderWidth: 1, borderColor: '#FFFFFF55' },
  chipText: { color: c.paper, fontSize: 12 },
  stamp: { position: 'absolute', top: 36, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 3 },
  like: { left: 22, borderColor: c.lime, backgroundColor: c.lime, transform: [{ rotate: '-12deg' }] },
  skip: { right: 22, borderColor: c.paper, backgroundColor: '#00000066', transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 24, fontWeight: '800', letterSpacing: 1, color: c.ink },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 22 },
  round: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.paper, borderWidth: 1.5, borderColor: c.line, shadowColor: '#000', shadowOpacity: .12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  roundLime: { backgroundColor: c.lime, borderColor: c.lime },
  roundSoft: { backgroundColor: c.soft },
  hint: { textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 14 },
  done: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 20, borderRadius: 28, backgroundColor: c.soft },
});
