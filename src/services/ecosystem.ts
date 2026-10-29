import type { Trip } from '../domain/model';

// Демо-адреса соседних приложений экосистемы (GitHub Pages). Это не рабочие интеграции:
// в релизе заменить на универсальные ссылки и проверку, установлено ли приложение.
export const GUIDE_WEB = 'https://volgintb-arch.github.io/voyz-app/';
export const BOOKING_WEB = 'https://volgintb-arch.github.io/voyz-booking/';

/** Карточка места в Voyz Guide (маршрут place/[id]) или главная гида, если место не связано. */
export const guideUrl = (placeId?: string) => placeId ? `${GUIDE_WEB}place/${encodeURIComponent(placeId)}` : GUIDE_WEB;

/**
 * Объект в Voyz Booking с датами поездки и числом гостей (параметры `in`, `out`, `g` из src/share/links.ts).
 * `src=direct` — Booking учитывает такую бронь в канале `voyz`. Без связанного объекта — общий поиск.
 * Публичный предпросмотр Booking работает с сервером, где демо-объектов из seed нет, поэтому
 * в демо Friends `staySlug` не заполнен: ссылка ведёт в поиск жилья.
 */
export function stayUrl(t: Pick<Trip, 'staySlug' | 'start' | 'end'>, guests: number): string {
  if (!t.staySlug) return `${BOOKING_WEB}#/guest`;
  const p = new URLSearchParams({ src: 'direct', in: t.start, out: t.end, g: String(Math.max(1, guests)) });
  return `${BOOKING_WEB}#/guest/p/${encodeURIComponent(t.staySlug)}?${p}`;
}
