import type { Command, DemoState, Application, Election, Trip } from './model';
import { activeStatuses, application, available, canChat, getTrip, traveler } from './selectors';
import { localDateAfter } from './seed';

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
const check = (condition: unknown, message: string): void => { if (!condition) throw new Error(message); };
const clean = (v: string, min: number, max: number, label: string) => {
  const value = v.trim(); check(value.length >= min && value.length <= max, `${label}: от ${min} до ${max} символов.`); return value;
};
const startAt = (t: Trip) => new Date(t.start + 'T07:00:00+06:00').getTime();
export function expireState(s: DemoState, now: number): boolean {
  let changed = false;
  for (const a of s.applications) {
    if ((a.status === 'reserved' || a.status === 'reconfirm') && a.expiresAt !== undefined && a.expiresAt <= now) {
      a.status = 'expired'; a.reason = 'Срок подтверждения истёк. Место и доступ ко всей переписке закрыты.'; changed = true;
    }
  }
  for (const e of s.elections) {
    if (!e.result && !e.supportReview && e.expiresAt <= now) { resolveElection(s, e, now); changed = true; }
  }
  return changed;
}

// Итог выборов по голосам. Правила тура 2 и передачи в поддержку — допущения спецификации, не решение владельца.
export function resolveElection(s: DemoState, e: Election, now: number): void {
  const t = getTrip(s, e.tripId); if (!t) return;
  const notice = (text: string) => s.notices.unshift({ id: `notice-${now}-${s.notices.length}-election`, text, tripId: t.id, at: now });
  const count = new Map(e.candidates.map(id => [id, 0]));
  for (const c of Object.values(e.votes)) if (count.has(c)) count.set(c, count.get(c)! + 1);
  const max = Math.max(0, ...count.values()), leaders = e.candidates.filter(id => count.get(id) === max);
  if (max > 0 && leaders.length === 1) {
    const winner = leaders[0]; e.result = winner; t.hostId = winner; t.status = 'open';
    const a = application(s, t.id, winner); if (a) a.status = 'left';
    notice(`Новый автор — ${traveler(s, winner)?.name ?? 'участник'} (голосов: ${max}). Заявки возобновлены.`);
  } else if ((e.round ?? 1) === 1) {
    e.round = 2; e.candidates = leaders; e.votes = {}; e.expiresAt = now + 86400000;
    notice(max ? 'Ничья — второй тур между лидерами, 24 часа.' : 'Голосов нет — второй тур, 24 часа.');
  } else {
    e.supportReview = true; notice('Второй тур не выявил автора. Решение передано в поддержку Voyz.');
  }
}

export function execute(state: DemoState, command: Command, now = Date.now()): DemoState {
  const s: DemoState = JSON.parse(JSON.stringify(state));
  const expired = expireState(s, now);
  if (command.type === 'EXPIRE') return expired ? s : state;
  const id = (prefix: string) => `${prefix}-${now}-${s.notices.length}-${s.applications.length}-${s.reviews.length}`;
  const notice = (text: string, tripId?: string) => s.notices.unshift({ id: id('notice'), text, tripId, at: now });
  const me = traveler(s, s.meId)!;
  const ready = () => check(s.loggedIn && me.verified && me.age >= 18, 'Войдите в демо-аккаунт и завершите анкету, проверку телефона и фото.');
  const tById = (tripId: string) => { const t = getTrip(s, tripId); check(t, 'Поездка не найдена.'); return t!; };
  const aById = (applicationId: string) => { const a = s.applications.find(x => x.id === applicationId); check(a, 'Заявка не найдена.'); return a!; };
  const host = (t: Trip, demo?: boolean) => check(demo || (s.loggedIn && t.hostId === s.meId), 'Это действие доступно автору поездки.');
  const close = (a: Application, status: Application['status'], reason: string) => { a.status = status; a.reason = reason; notice(reason, a.tripId); };
  switch (command.type) {
    case 'WELCOME': s.welcomeSeen = true; break;
    case 'LOGIN': s.loggedIn = command.enabled; break;
    case 'VISIBILITY': me.visible = !me.visible; break;
    case 'VERIFY': me.verified = command.enabled; break;
    case 'PROFILE':
      check(Number.isInteger(command.age) && command.age >= 18 && command.age <= 100, 'Возраст должен быть от 18 до 100 лет.');
      Object.assign(me, { name: clean(command.name, 1, 40, 'Имя'), age: command.age, city: clean(command.city, 1, 80, 'Город'), about: clean(command.about, 5, 1000, 'Описание') }); break;
    case 'SAVE': tById(command.tripId); s.saved = s.saved.includes(command.tripId) ? s.saved.filter(x => x !== command.tripId) : [...s.saved, command.tripId]; break;
    case 'APPLY': {
      ready(); const t = tById(command.tripId); check(!t.commercial, 'Тур бронируется в Voyz. Социальная заявка не резервирует коммерческое место.');
      check(t.hostId !== s.meId, 'Вы уже автор этой поездки.');
      check(t.status === 'open' && startAt(t) > now && available(s, t) > 0, 'Набор закрыт, поездка началась или мест больше нет.');
      check(t.composition === 'mixed' || t.composition === me.gender, 'Для этой поездки выбран другой состав компании.');
      check(command.termsVersion === t.termsVersion, 'Условия изменились. Прочитайте актуальную версию.');
      const previous = application(s, t.id);
      check(!previous || ['expired', 'left', 'withdrawn'].includes(previous.status), 'У вас уже есть активная заявка или решение автора.');
      check(command.answers.length === t.questions.length && command.answers.every(a => a.trim().length > 0 && a.length <= 300), 'Ответьте на вопросы автора.');
      const a: Application = { id: id('application'), tripId: t.id, userId: s.meId, status: 'pending', message: clean(command.message, 5, 1000, 'Сообщение'), answers: command.answers.map(a => a.trim()), termsVersion: t.termsVersion, createdAt: now };
      s.applications = s.applications.filter(x => !(x.tripId === t.id && x.userId === s.meId)); s.applications.push(a); notice('Заявка отправлена автору.', t.id); break;
    }
    case 'APPROVE': {
      const a = aById(command.applicationId), t = tById(a.tripId); host(t, command.demo);
      check(a.status === 'pending' && t.status === 'open' && !t.commercial && startAt(t) > now, 'Эту заявку уже нельзя одобрить.');
      check(available(s, t) > 0, 'Свободных мест нет.');
      a.status = 'reserved'; a.termsVersion = t.termsVersion; a.approvedAt = now; a.expiresAt = Math.min(now + 86400000, startAt(t));
      notice('Заявка одобрена. Чат открыт, подтвердите «Еду» до окончания резерва.', t.id); break;
    }
    case 'DECLINE': {
      const a = aById(command.applicationId); host(tById(a.tripId), command.demo); check(a.status === 'pending', 'Заявка уже обработана.'); close(a, 'declined', 'Автор отклонил заявку.'); break;
    }
    case 'CONFIRM': {
      ready(); const a = aById(command.applicationId), t = tById(a.tripId);
      check(command.demo || a.userId === s.meId, 'Нельзя подтвердить участие другого человека.');
      check(a.status === 'reserved' && a.expiresAt! > now && a.termsVersion === t.termsVersion, 'Резерв недоступен или условия изменились.');
      a.status = 'confirmed'; a.confirmedAt = now; notice('Участие подтверждено.', t.id); break;
    }
    case 'WITHDRAW': {
      const a = aById(command.applicationId); check(a.userId === s.meId && a.status === 'pending', 'Заявку уже нельзя отозвать.'); close(a, 'withdrawn', 'Вы отозвали заявку.'); break;
    }
    case 'LEAVE': {
      const t = tById(command.tripId), a = application(s, t.id); check(t.hostId !== s.meId, 'Автор выходит через выбор нового автора.');
      check(a && activeStatuses.includes(a.status), 'Активного участия нет.'); close(a!, 'left', 'Вы вышли. Место освобождено, вся переписка недоступна.'); break;
    }
    case 'EXCLUDE': {
      const a = aById(command.applicationId); host(tById(a.tripId), command.demo); check(activeStatuses.includes(a.status), 'Участник уже не в группе.');
      close(a, 'excluded', clean(command.reason, 5, 500, 'Причина исключения')); break;
    }
    case 'DEMO_EXPIRE': {
      const a = application(s, command.tripId); check(a && ['reserved', 'reconfirm'].includes(a.status), 'Сначала получите резерв.'); a!.expiresAt = now - 1; expireState(s, now); notice('Демо: срок подтверждения истёк.', command.tripId); break;
    }
    case 'CONNECT': {
      ready(); check(command.userId !== s.meId && traveler(s, command.userId), 'Анкета не найдена.');
      check(!s.blocked.includes(command.userId) && !s.connections.some(c => c.userId === command.userId), 'Повторный запрос недоступен.');
      const day = localDateAfter(0, now); if (s.daily.day !== day) s.daily = { day, count: 0 };
      check(s.daily.count < 5, 'Сегодня отправлено 5 запросов. Новые доступны завтра по времени Бишкека.');
      s.connections.push({ userId: command.userId, status: 'pending', message: clean(command.message, 5, 1000, 'Сообщение'), createdAt: now }); s.daily.count++; notice('Запрос на знакомство отправлен.'); break;
    }
    case 'DEMO_CONNECTION': {
      const c = s.connections.find(c => c.userId === command.userId); check(c?.status === 'pending', 'Нет ожидающего запроса.'); c!.status = command.accepted ? 'accepted' : 'declined'; notice(command.accepted ? 'Запрос принят. Можно общаться.' : 'Запрос отклонён.'); break;
    }
    case 'MESSAGE': {
      check(canChat(s, command.chatId), 'Доступ ко всей переписке закрыт.');
      const message = { id: `${id('message')}-${s.messages[command.chatId]?.length || 0}`, senderId: s.meId, text: clean(command.text, 1, 2000, 'Сообщение'), at: now };
      (s.messages[command.chatId] ??= []).push(message); break;
    }
    case 'CREATE': {
      ready(); const d = command.input;
      check(isDate(d.start) && isDate(d.end) && d.end >= d.start && d.start >= localDateAfter(0, now), 'Укажите корректные будущие даты в формате ГГГГ-ММ-ДД.');
      const span = (new Date(d.end).getTime() - new Date(d.start).getTime()) / 86400000 + 1;
      check(Number.isInteger(d.duration) && d.duration >= 1 && d.duration <= span, 'Длительность не помещается в выбранный период.');
      check(Number.isInteger(d.capacity) && d.capacity >= 1 && d.capacity <= 20, 'Свободных мест должно быть от 1 до 20, без автора.');
      check(d.budget === null || (Number.isFinite(d.budget) && d.budget >= 0), 'Проверьте бюджет.'); check(d.questions.length <= 3, 'Можно добавить до трёх вопросов.');
      const t: Trip = { ...d, id: id('trip'), hostId: s.meId, title: clean(d.title, 3, 70, 'Название'), place: clean(d.place, 2, 120, 'Маршрут'), area: clean(d.area, 2, 100, 'Район старта'), meeting: clean(d.meeting, 5, 250, 'Точка встречи'), description: clean(d.description, 20, 3000, 'Описание'), questions: d.questions.map(q => clean(q, 2, 150, 'Вопрос')), photo: 'mountain', languages: [...me.languages], format: 'Горы', termsVersion: 1, status: 'open', commercial: false };
      s.trips.unshift(t); notice('Поездка опубликована в локальном демо.', t.id); break;
    }
    case 'ENROLLMENT': {
      const t = tById(command.tripId); host(t); check(t.status === 'open' || t.status === 'closed', 'Нельзя менять набор в этом состоянии.'); t.status = t.status === 'open' ? 'closed' : 'open'; break;
    }
    case 'TERMS': {
      const t = tById(command.tripId); host(t, command.demo); check(!t.commercial && !['completed', 'cancelled', 'election'].includes(t.status), 'Условия сейчас нельзя изменить.');
      check(isDate(command.start) && isDate(command.end) && command.end >= command.start && command.start >= localDateAfter(0, now), 'Проверьте даты.');
      check(command.budget === null || (Number.isFinite(command.budget) && command.budget >= 0), 'Проверьте бюджет.');
      check(!s.applications.some(a => a.tripId === t.id && a.status === 'reserved'), 'Сначала дождитесь подтверждения или окончания активных резервов. Сочетание таймеров пока требует решения.');
      const place = clean(command.place, 2, 120, 'Маршрут');
      check(t.start !== command.start || t.end !== command.end || t.budget !== command.budget || t.place !== place, 'Существенных изменений нет.');
      t.previousTerms = { start: t.start, end: t.end, budget: t.budget, place: t.place };
      Object.assign(t, { start: command.start, end: command.end, budget: command.budget, place, termsVersion: t.termsVersion + 1 });
      for (const a of s.applications.filter(a => a.tripId === t.id && (a.status === 'confirmed' || a.status === 'reconfirm'))) {
        const oldDeadline = a.status === 'reconfirm' ? a.expiresAt : undefined;
        a.status = 'reconfirm'; a.expiresAt = Math.min(oldDeadline ?? Infinity, now + 86400000, startAt(t));
      }
      notice('Условия изменены. Требуется согласие на актуальную версию.', t.id); break;
    }
    case 'RECONFIRM': {
      const a = application(s, command.tripId), t = tById(command.tripId); check(a?.status === 'reconfirm' && a.expiresAt! > now, 'Срок подтверждения уже недоступен.');
      if (command.accepted) { a!.status = 'confirmed'; a!.termsVersion = t.termsVersion; notice('Новые условия подтверждены.', t.id); }
      else close(a!, 'left', 'Вы отказались от новых условий. Место и переписка закрыты.'); break;
    }
    case 'BLOCK': check(command.userId !== s.meId, 'Нельзя заблокировать себя.'); if (!s.blocked.includes(command.userId)) s.blocked.push(command.userId); break;
    case 'REPORT': s.complaints.unshift({ id: id('complaint'), targetId: command.targetId, category: command.category, text: clean(command.text, 10, 2000, 'Описание'), at: now }); break;
    case 'START_ELECTION': {
      const t = tById(command.tripId); host(t); check(!t.commercial && !['completed', 'cancelled', 'election'].includes(t.status), 'Выбор автора сейчас недоступен.');
      const eligible = s.applications.filter(a => a.tripId === t.id && a.status === 'confirmed').map(a => a.userId);
      if (!eligible.length) { t.hostId = null; t.formerHostId = s.meId; t.status = 'cancelled'; notice('Никого для выбора автора не осталось. Поездка отменена.', t.id); break; }
      // Candidates consent is simulated; this is explicitly a demo control, not a production vote.
      s.elections.push({ tripId: t.id, candidates: eligible, eligibleVoters: eligible, votes: {}, expiresAt: now + 172800000 });
      t.formerHostId = s.meId; t.hostId = null; t.status = 'election'; notice('Выбор автора открыт. Новые заявки приостановлены.', t.id); break;
    }
    case 'VOTE': {
      const e = s.elections.find(e => e.tripId === command.tripId && !e.result); check(e && e.candidates.includes(command.candidateId), 'Кандидат недоступен.');
      check(!e!.supportReview, 'Голосование завершено, решение за поддержкой Voyz.');
      check(e!.eligibleVoters.includes(s.meId) && e!.expiresAt > now, 'Вы не входите в состав голосующих или срок истёк.'); e!.votes[s.meId] = command.candidateId; break;
    }
    case 'DEMO_VOTES': {
      const e = s.elections.find(e => e.tripId === command.tripId && !e.result && !e.supportReview); check(e?.candidates.length, 'Нет открытых выборов.');
      for (const v of e!.eligibleVoters) if (v !== s.meId && !e!.votes[v]) e!.votes[v] = e!.candidates[0];
      notice('Демо: остальные участники проголосовали.', command.tripId); break;
    }
    case 'DEMO_ELECTION_FINISH': {
      const e = s.elections.find(e => e.tripId === command.tripId && !e.result && !e.supportReview); tById(command.tripId); check(e?.candidates.length, 'Нет открытых выборов.');
      resolveElection(s, e!, now); break;
    }
    case 'DEMO_COMPLETE': {
      const t = tById(command.tripId); check(t.hostId === s.meId || application(s, t.id)?.status === 'confirmed', 'Сначала подтвердите участие.'); t.status = 'completed'; notice('Демо: обе стороны подтвердили совместную поездку.', t.id); break;
    }
    case 'REVIEW': {
      const t = tById(command.tripId); check(t.status === 'completed' && application(s, t.id)?.status === 'confirmed', 'Отзыв доступен после демонстрационного взаимного подтверждения.');
      check(!s.reviews.some(r => r.tripId === t.id && r.userId === s.meId), 'Отзыв уже сохранён.'); check(Number.isInteger(command.score) && command.score >= 1 && command.score <= 5, 'Выберите оценку от 1 до 5.');
      s.reviews.push({ id: id('review'), tripId: t.id, userId: s.meId, score: command.score, text: clean(command.text, 5, 1000, 'Отзыв'), at: now }); break;
    }
  }
  return s;
}
