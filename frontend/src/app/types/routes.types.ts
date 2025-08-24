import { Enum } from "./util.types";

export const AppRoutes = {
  Uploads: 'uploads',
  Management: 'management',
} as const;
export type AppRoutes = Enum<typeof AppRoutes>;
