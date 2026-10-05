import data from 'virtual:content';
import type { Content } from './build.ts';

export type { Achievement, Content, JourneyEntry, Project, Room, SkillCategory } from './build.ts';
export type { Localized, RoomId } from './schema.ts';

export const content: Content = data;
