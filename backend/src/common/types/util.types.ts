import { Enum } from '@ac-assignment/shared-types';

export type UpdateEntity<T> = Partial<Omit<T, 'id'>>;

export const ThrottleType = {
  Short: 'short',
  Medium: 'medium',
  Long: 'long',
} as const;
export type ThrottleType = Enum<typeof ThrottleType>;
