import type { Application, DemoState, Traveler, Trip } from './model';

export function localDateAfter(n: number, now = Date.now()) {
  const d = new Date(now + n * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bishkek', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function createSeed(now = Date.now()): DemoState {
  const d = (n: number) => localDateAfter(n, now);
  const base = { visible: true, verified: true, start: d(3), end: d(18) };
  const travelers: Traveler[] = [
    { ...base, id: 'me', name: 'Нурлан', age: 31, gender: 'male', city: 'Бишкек', photo: 'alex', languages: ['Русский', 'Кыргызский', 'English'], about: 'Хочу чаще выбираться в путешествия и находить людей, с которыми по пути.', interests: ['Горы', 'Дорога'], plan: 'Открыт к новым маршрутам', budget: null },
    { ...base, id: 'aida', name: 'Айдана', age: 28, gender: 'female', city: 'Бишкек', photo: 'aida', languages: ['Русский', 'Кыргызский', 'English'], about: 'Люблю большие горы и маленькие компании. В путешествиях оставляю время просто посидеть с видом.', interests: ['Горы', 'Фотография'], plan: 'Ищу компанию на Сон-Куль', budget: 7000 },
    { ...base, id: 'timur', name: 'Тимур', age: 32, gender: 'male', city: 'Бишкек', photo: 'timur', languages: ['Русский', 'Кыргызский'], about: 'По выходным выбираюсь из города. Люблю пешие маршруты и неспешные разговоры.', interests: ['Походы', 'Автопоездки'], plan: 'В Ала-Арчу на выходных', budget: 2000 },
    { ...base, id: 'anna', name: 'Анна', age: 26, gender: 'female', city: 'Сейчас в Караколе', photo: 'anna', languages: ['Русский', 'English'], about: 'Приехала исследовать Кыргызстан. Буду рада компании для прогулок и коротких путешествий.', interests: ['Озёра', 'Прогулки'], plan: 'Несколько дней у Иссык-Куля', budget: null },
    { ...base, id: 'alex', name: 'Алекс', age: 30, gender: 'male', city: 'Алматы → Бишкек', photo: 'alex', languages: ['English', 'Русский'], about: 'Еду в Кыргызстан впервые. Хочу собрать небольшое путешествие без спешки.', interests: ['Природа', 'Кемпинг'], plan: 'Открыт к вашим маршрутам', budget: 10000 },
  ];
  const make = (id: string, title: string, place: string, photo: string, hostId: string, offset: number, budget: number | null, extra: Partial<Trip> = {}): Trip => ({
    id, title, place, photo, hostId, start: d(offset), end: d(offset + 2), duration: 3,
    flexible: false, capacity: 4, budget, composition: 'mixed', area: 'Бишкек',
    meeting: 'У филармонии, восточная сторона. Встречаемся в 07:00.',
    description: 'Собираем небольшую компанию на несколько дней. Вместе обсудим дорогу, остановки и проживание. Каждый оплачивает свою часть расходов самостоятельно. Маршрут и даты в прототипе демонстрационные.',
    languages: ['Русский', 'English'], format: 'Горы', questions: ['Какой у вас опыт подобных поездок?', 'Как планируете добираться?'], termsVersion: 1, status: 'open', commercial: false, ...extra,
  });
  const trips: Trip[] = [
    // guidePlaceId — id места из справочника Voyz Guide (voyz-app/assets/data/places.json).
    make('son', 'Сон-Куль. Ближе к небу', 'Сон-Куль', 'mountain', 'aida', 9, 6500, { guidePlaceId: 'kg-son-kul' }),
    make('archa', 'Выходной в Ала-Арче', 'Ала-Арча', 'road', 'timur', 4, 1800, { duration: 1, end: d(4), capacity: 5, format: 'Походы', questions: ['Вам подходит неспешный темп?'], guidePlaceId: 'kg-0003' }),
    make('issyk', 'По южному берегу', 'Иссык-Куль', 'lake', 'anna', 7, null, { composition: 'female', flexible: true, format: 'Озёра', guidePlaceId: 'kg-0039' }),
    make('tour', 'Кыргызстан в небольшой группе', 'Авторский тур Voyz', 'road', 'aida', 14, 24000, { commercial: true, organizer: 'Voyz · демо-организатор', format: 'Автопоездки' }),
    make('own', 'Каньоны и дорога к озеру', 'Конорчек → Иссык-Куль', 'mountain', 'me', 12, null, { questions: ['Есть ли у вас машина?'], format: 'Автопоездки', guidePlaceId: 'kg-0096' }),
  ];
  const member = (id: string, tripId: string, userId: string, status: Application['status'] = 'confirmed'): Application => ({ id, tripId, userId, status, message: 'Буду рад присоединиться к компании.', answers: ['Есть опыт, темп подходит.', 'Планирую ехать пассажиром.'], termsVersion: 1, createdAt: now - 600000, confirmedAt: status === 'confirmed' ? now - 300000 : undefined });
  return { version: 1, meId: 'me', loggedIn: true, welcomeSeen: false, travelers, trips,
    applications: [member('son-timur', 'son', 'timur'), member('archa-aida', 'archa', 'aida'), member('own-aida', 'own', 'aida'), member('own-anna', 'own', 'anna', 'pending')],
    connections: [], saved: [], blocked: [], notices: [], complaints: [], reviews: [], daily: { day: '', count: 0 }, elections: [],
    messages: {
      son: [{ id: 'msg1', senderId: 'aida', text: 'Давайте сначала познакомимся и обсудим маршрут. Это демонстрационная переписка.', at: now - 600000 }],
      own: [{ id: 'msg2', senderId: 'aida', text: 'Я за! Давайте оставим время для остановок по дороге.', at: now - 300000 }],
    },
  };
}
