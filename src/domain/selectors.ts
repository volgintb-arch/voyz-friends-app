import type { Application, DemoState, SearchFilters, Trip } from './model';

export const activeStatuses = ['reserved', 'confirmed', 'reconfirm'];
export const traveler = (s: DemoState, id: string) => s.travelers.find(p => p.id === id);
export const getTrip = (s: DemoState, id: string) => s.trips.find(t => t.id === id);
export const application = (s: DemoState, tripId: string, userId = s.meId) => s.applications.find(a => a.tripId === tripId && a.userId === userId);
export const tripApplications = (s: DemoState, tripId: string) => s.applications.filter(a => a.tripId === tripId);
export const occupied = (s: DemoState, tripId: string) => tripApplications(s, tripId).filter(a => activeStatuses.includes(a.status)).length;
export const available = (s: DemoState, t: Trip) => Math.max(0, t.capacity - occupied(s, t.id));
export const members = (s: DemoState, tripId: string) => tripApplications(s, tripId).filter(a => activeStatuses.includes(a.status));
export const canChat = (s: DemoState, chatId: string) => {
  if (!s.loggedIn) return false;
  if (chatId.startsWith('dm:')) {
    const id = chatId.slice(3);
    return !s.blocked.includes(id) && s.connections.some(c => c.userId === id && c.status === 'accepted');
  }
  const t = getTrip(s, chatId);
  // Commercial chat access is owned by Voyz booking eligibility, never by a social request.
  if (!t || t.commercial || t.status === 'cancelled') return false;
  return t.hostId === s.meId || activeStatuses.includes(application(s, chatId)?.status || '');
};
export const statusLabel = (a?: Application) => a ? ({ pending: 'На рассмотрении', reserved: 'Место в резерве', confirmed: 'Вы едете', reconfirm: 'Нужно новое согласие', declined: 'Заявка отклонена', expired: 'Резерв истёк', left: 'Вы вышли', excluded: 'Вы исключены', withdrawn: 'Заявка отозвана' })[a.status] : '';
export const budgetText = (v: number | null) => v === null ? 'Обсудим вместе' : `${v.toLocaleString('ru-RU')} сом`;
export const dateText = (date: string) => new Date(`${date}T12:00:00+06:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Asia/Bishkek' });
export const datesText = (t: Trip) => `${dateText(t.start)}${t.end !== t.start ? ' — ' + dateText(t.end) : ''}${t.flexible ? ' · гибкие даты' : ''}`;
export const remaining = (expiresAt: number, now = Date.now()) => { const m = Math.max(0, Math.ceil((expiresAt - now) / 60000)); return `${Math.floor(m / 60)} ч ${m % 60} мин`; };
export const matches = (t: Trip, query: string, f: SearchFilters) => {
  if (query && !`${t.title} ${t.place} ${t.area}`.toLowerCase().includes(query.toLowerCase())) return false;
  if (f.language && !t.languages.includes(f.language)) return false;
  if (f.from && t.end < f.from) return false;
  if (f.to && t.start > f.to) return false;
  if (f.maxBudget && t.budget !== null && t.budget > Number(f.maxBudget)) return false;
  if (f.maxBudget && t.budget === null && !f.unknownBudget) return false;
  if (f.composition && t.composition !== f.composition) return false;
  if (f.maxDuration && t.duration > Number(f.maxDuration)) return false;
  return true;
};
