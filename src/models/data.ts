import type { Person, Meeting } from '../models/types';

export const persons: Person[] = [];
export const meetings: Meeting[] = [];
export const personSchedules: Map<string, Set<string>> = new Map();
