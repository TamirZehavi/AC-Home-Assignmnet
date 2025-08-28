import { ThrottlerOptions } from '@nestjs/throttler';
import { ThrottleType } from '../types/util.types';

export const throttles: { [key in ThrottleType]: ThrottlerOptions } = {
  [ThrottleType.Short]: {
    ttl: 60000,
    limit: 2,
  },
  [ThrottleType.Medium]: {
    ttl: 60000,
    limit: 10,
  },
  [ThrottleType.Long]: {
    ttl: 60000,
    limit: 25,
  },
};
