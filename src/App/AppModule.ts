import { randomUUID } from 'crypto';

import { AppController } from '@app/Presentation/Controllers/AppController';
import { AuthModule } from '@auth/AuthModule';
import { EnvConfig, EnvSchema } from '@config/EnvConfig';
import TypeormConfig from '@config/TypeormConfig';
import { ItemModule } from '@item/ItemModule';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '@shared/SharedModule';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfig],
      validationSchema: EnvSchema,
      isGlobal: true
    }),
    CqrsModule.forRoot(),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => randomUUID()
      }
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeormConfig
    }),
    AuthModule,
    ItemModule,
    SharedModule
  ],
  controllers: [AppController]
})

export class AppModule {}
