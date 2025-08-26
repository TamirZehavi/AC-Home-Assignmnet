import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EnvironmentVariables,
  EnvironmentVariableTypes,
} from '../types/env.types';

@Injectable()
export class SafeConfigService {
  constructor(private readonly configService: ConfigService) {}

  get<T extends EnvironmentVariables>(
    key: T,
    defaultValue?: EnvironmentVariableTypes[T],
  ) {
    let result: EnvironmentVariableTypes[T] | undefined = undefined;
    if (defaultValue)
      result = this.configService.get<EnvironmentVariableTypes[T]>(
        key,
        defaultValue,
      );
    else result = this.configService.get<EnvironmentVariableTypes[T]>(key);
    if (!result) throw Error('Missing configuration');
    return result;
  }
}
