import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // API prefix is set globally in main.ts
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NestJS Backend with Angular SSR'
    };
  }
}
