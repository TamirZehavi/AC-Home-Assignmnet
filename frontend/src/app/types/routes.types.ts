import { Enum } from '@ac-assignment/shared-types';

export const AppRoutes = {
  Uploads: 'uploads',
  Management: 'management',
} as const;
export type AppRoutes = Enum<typeof AppRoutes>;
