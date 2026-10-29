import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../src/domain/seed';
import { execute, isDate } from '../src/domain/commands';
import { application, available, canChat, getTrip, occupied } from '../src/domain/selectors';
import type { Command, DemoState } from '../src/domain/model';

const NOW = new Date('2026-10-30T10:00:00Z').getTime();
const seed = () => createSeed(NOW);
const command = (s: DemoState, c: Command, at = NOW) => execute(s, c, at);
const apply = (s = seed()) => command(s, { type: 'APPLY', tripId: 'son', message: 'Хочу присоединиться к поездке.', answers: ['Есть опыт', 'Еду пассажиром'], termsVersion: 1 });
const reserve = () => { let s = apply(); s = command(s, { type: 'APPROVE', applicationId: application(s, 'son')!.id, demo: true }); return s; };
const confirm = () => { let s = reserve(); s = command(s, { type: 'CONFIRM', applicationId: application(s, 'son')!.id }); return s; };

test('pending request grants no chat; approval reserves a place and grants chat before confirmation', () => {
  const pending = apply(); assert.equal(canChat(pending, 'son'), false);
  const s = reserve(); assert.equal(application(s, 'son')!.status, 'reserved'); assert.equal(canChat(s, 'son'), true);
  assert.equal(available(s, getTrip(s, 'son')!), 2); assert.equal(application(s, 'son')!.expiresAt, NOW + 86400000);
});
test('confirmation keeps one occupied place and duplicate confirmation fails', () => {
  const s = confirm(); assert.equal(application(s, 'son')!.status, 'confirmed'); assert.equal(occupied(s, 'son'), 2);
  assert.throws(() => command(s, { type: 'CONFIRM', applicationId: application(s, 'son')!.id }));
});
test('expiry revokes all chat access and message writes; a new application is possible', () => {
  let s = reserve(); s = command(s, { type: 'EXPIRE' }, NOW + 86400001);
  assert.equal(application(s, 'son')!.status, 'expired'); assert.equal(canChat(s, 'son'), false); assert.equal(occupied(s, 'son'), 1);
  assert.throws(() => command(s, { type: 'MESSAGE', chatId: 'son', text: 'Не должно уйти' }, NOW + 86400001));
  s = command(s, { type: 'APPLY', tripId: 'son', message: 'Хочу вернуться в поездку.', answers: ['Есть опыт', 'Пассажир'], termsVersion: 1 }, NOW + 86400002);
  assert.equal(application(s, 'son')!.status, 'pending'); assert.equal(canChat(s, 'son'), false);
});
test('leaving revokes chat without deleting messages needed by remaining participants', () => {
  let s = confirm(); s = command(s, { type: 'MESSAGE', chatId: 'son', text: 'Обсудим дорогу.' });
  s = command(s, { type: 'LEAVE', tripId: 'son' }); assert.equal(canChat(s, 'son'), false); assert.ok(s.messages.son.some(m => m.text === 'Обсудим дорогу.'));
});
test('last-place approvals cannot overbook or approve the same request twice', () => {
  let s = apply(); getTrip(s, 'son')!.capacity = 2;
  s.applications.push({ ...application(s, 'son')!, id: 'other-request', userId: 'anna' });
  s = command(s, { type: 'APPROVE', applicationId: application(s, 'son')!.id, demo: true });
  assert.equal(available(s, getTrip(s, 'son')!), 0);
  assert.throws(() => command(s, { type: 'APPROVE', applicationId: 'other-request', demo: true }));
  assert.throws(() => command(s, { type: 'APPROVE', applicationId: application(s, 'son')!.id, demo: true }));
});
test('terms use versions; refusal revokes place and chat; repeated edits do not extend deadline', () => {
  let s = confirm(), t = getTrip(s, 'son')!;
  s = command(s, { type: 'TERMS', tripId: t.id, start: t.start, end: t.end, place: t.place, budget: 9000, demo: true });
  assert.equal(application(s, 'son')!.status, 'reconfirm'); const deadline = application(s, 'son')!.expiresAt;
  s = command(s, { type: 'TERMS', tripId: t.id, start: t.start, end: t.end, place: t.place, budget: 9500, demo: true }, NOW + 60000);
  assert.equal(application(s, 'son')!.expiresAt, deadline);
  s = command(s, { type: 'RECONFIRM', tripId: t.id, accepted: false }, NOW + 60001);
  assert.equal(canChat(s, t.id), false); assert.equal(occupied(s, t.id), 1);
});
test('stale application version and reserved/terms timer conflicts are rejected explicitly', () => {
  const s = seed(); getTrip(s, 'son')!.termsVersion = 2; assert.throws(() => apply(s));
  const reserved = reserve(), t = getTrip(reserved, 'son')!;
  assert.throws(() => command(reserved, { type: 'TERMS', tripId: t.id, start: t.start, end: t.end, place: t.place, budget: 8000, demo: true }));
});
test('exclusion requires cause, preserves appeal reason and closes chat', () => {
  let s = confirm(); assert.throws(() => command(s, { type: 'EXCLUDE', applicationId: application(s, 'son')!.id, reason: ' ', demo: true }));
  s = command(s, { type: 'EXCLUDE', applicationId: application(s, 'son')!.id, reason: 'Изменился состав компании.', demo: true });
  assert.equal(canChat(s, 'son'), false); assert.match(application(s, 'son')!.reason!, /состав/);
});
test('one message before accepted personal connection; decline forbids repeated request', () => {
  let s = command(seed(), { type: 'CONNECT', userId: 'aida', message: 'Давайте познакомимся для поездки.' });
  assert.throws(() => command(s, { type: 'MESSAGE', chatId: 'dm:aida', text: 'Ещё сообщение' }));
  s = command(s, { type: 'DEMO_CONNECTION', userId: 'aida', accepted: false });
  assert.throws(() => command(s, { type: 'CONNECT', userId: 'aida', message: 'Повторный запрос' }));
});
test('sixth daily request fails and does not spend or create anything extra', () => {
  let s = seed(); for (let n = 0; n < 6; n++) s.travelers.push({ ...s.travelers[1], id: 'extra' + n });
  for (let n = 0; n < 5; n++) s = command(s, { type: 'CONNECT', userId: 'extra' + n, message: 'Давайте знакомиться.' });
  assert.throws(() => command(s, { type: 'CONNECT', userId: 'extra5', message: 'Давайте знакомиться.' }));
  assert.equal(s.daily.count, 5); assert.equal(s.connections.length, 5);
});
test('only host can moderate; leaving host loses chat and pauses enrolment', () => {
  const reserved = reserve(); assert.throws(() => command(reserved, { type: 'EXCLUDE', applicationId: application(reserved, 'son')!.id, reason: 'Без полномочий' }));
  let s = command(seed(), { type: 'START_ELECTION', tripId: 'own' });
  assert.equal(getTrip(s, 'own')!.hostId, null); assert.equal(getTrip(s, 'own')!.status, 'election'); assert.equal(canChat(s, 'own'), false);
  assert.throws(() => command(s, { type: 'VOTE', tripId: 'own', candidateId: 'aida' }));
  s = command(s, { type: 'DEMO_ELECTION_FINISH', tripId: 'own' }); assert.equal(getTrip(s, 'own')!.hostId, 'aida');
});
test('commercial tour cannot grant local booking or chat; calendar rejects nonexistent dates', () => {
  const s = seed(); assert.equal(canChat(s, 'tour'), false);
  assert.throws(() => command(s, { type: 'APPLY', tripId: 'tour', message: 'Хочу на тур.', answers: ['Опыт', 'Пассажир'], termsVersion: 1 }));
  assert.equal(isDate('2026-02-30'), false); assert.equal(isDate('2026-11-07'), true);
});
