export type Id = string;
export type Gender = 'female' | 'male';
export type Composition = Gender | 'mixed';
export type ApplicationStatus = 'pending' | 'reserved' | 'confirmed' | 'reconfirm' | 'declined' | 'expired' | 'left' | 'excluded' | 'withdrawn';
export type TripStatus = 'open' | 'closed' | 'election' | 'completed' | 'cancelled';

export interface Traveler {
  id: Id;
  name: string;
  age: number;
  city: string;
  gender: Gender;
  photo: string;
  languages: string[];
  about: string;
  interests: string[];
  visible: boolean;
  verified: boolean;
  plan: string;
  start: string;
  end: string;
  budget: number | null;
}

export interface Trip {
  id: Id;
  hostId: Id | null;
  formerHostId?: Id;
  title: string;
  place: string;
  photo: string;
  start: string;
  end: string;
  flexible: boolean;
  duration: number;
  capacity: number;
  budget: number | null;
  composition: Composition;
  area: string;
  meeting: string;
  description: string;
  languages: string[];
  format: string;
  questions: string[];
  termsVersion: number;
  status: TripStatus;
  commercial: boolean;
  organizer?: string;
  previousTerms?: { start: string; end: string; budget: number | null; place: string };
}

export interface Application {
  id: Id;
  tripId: Id;
  userId: Id;
  status: ApplicationStatus;
  message: string;
  answers: string[];
  termsVersion: number;
  createdAt: number;
  approvedAt?: number;
  expiresAt?: number;
  confirmedAt?: number;
  reason?: string;
}

export interface Connection {
  userId: Id;
  status: 'pending' | 'accepted' | 'declined';
  message: string;
  createdAt: number;
}
export interface Message { id: Id; senderId: Id; text: string; at: number }
export interface Notice { id: Id; text: string; tripId?: Id; at: number }
export interface Complaint { id: Id; targetId: Id; category: string; text: string; at: number }
export interface Review { id: Id; tripId: Id; userId: Id; score: number; text: string; at: number }
export interface Election {
  tripId: Id;
  candidates: Id[];
  eligibleVoters: Id[];
  votes: Record<Id, Id>;
  expiresAt: number;
  result?: Id;
}

export interface DemoState {
  version: 1;
  meId: Id;
  loggedIn: boolean;
  welcomeSeen: boolean;
  travelers: Traveler[];
  trips: Trip[];
  applications: Application[];
  connections: Connection[];
  messages: Record<Id, Message[]>;
  notices: Notice[];
  saved: Id[];
  blocked: Id[];
  complaints: Complaint[];
  reviews: Review[];
  daily: { day: string; count: number };
  elections: Election[];
}

export interface SearchFilters {
  language: string;
  maxBudget: string;
  unknownBudget: boolean;
  from: string;
  to: string;
  composition: '' | Composition;
  maxDuration: string;
}
export const emptyFilters: SearchFilters = { language: '', maxBudget: '', unknownBudget: true, from: '', to: '', composition: '', maxDuration: '' };

export interface CreateTripInput {
  title: string; place: string; start: string; end: string; flexible: boolean;
  duration: number; capacity: number; composition: Composition; area: string;
  meeting: string; budget: number | null; description: string; questions: string[];
}

export type Command =
  | { type: 'WELCOME' }
  | { type: 'LOGIN'; enabled: boolean }
  | { type: 'VISIBILITY' }
  | { type: 'VERIFY'; enabled: boolean }
  | { type: 'PROFILE'; name: string; age: number; city: string; about: string }
  | { type: 'SAVE'; tripId: Id }
  | { type: 'APPLY'; tripId: Id; message: string; answers: string[]; termsVersion: number }
  | { type: 'APPROVE'; applicationId: Id; demo?: boolean }
  | { type: 'DECLINE'; applicationId: Id; demo?: boolean }
  | { type: 'CONFIRM'; applicationId: Id; demo?: boolean }
  | { type: 'WITHDRAW'; applicationId: Id }
  | { type: 'LEAVE'; tripId: Id }
  | { type: 'EXCLUDE'; applicationId: Id; reason: string; demo?: boolean }
  | { type: 'EXPIRE' }
  | { type: 'DEMO_EXPIRE'; tripId: Id }
  | { type: 'CONNECT'; userId: Id; message: string }
  | { type: 'DEMO_CONNECTION'; userId: Id; accepted: boolean }
  | { type: 'MESSAGE'; chatId: Id; text: string }
  | { type: 'CREATE'; input: CreateTripInput }
  | { type: 'ENROLLMENT'; tripId: Id }
  | { type: 'TERMS'; tripId: Id; start: string; end: string; budget: number | null; place: string; demo?: boolean }
  | { type: 'RECONFIRM'; tripId: Id; accepted: boolean }
  | { type: 'BLOCK'; userId: Id }
  | { type: 'REPORT'; targetId: Id; category: string; text: string }
  | { type: 'START_ELECTION'; tripId: Id }
  | { type: 'VOTE'; tripId: Id; candidateId: Id }
  | { type: 'DEMO_ELECTION_FINISH'; tripId: Id }
  | { type: 'DEMO_COMPLETE'; tripId: Id }
  | { type: 'REVIEW'; tripId: Id; score: number; text: string };
