import Compression from '@fastify/compress';
import FastifyMultipart from '@fastify/multipart';
import { RequestMethod } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AllExceptionsFilter } from '@shared/Exceptions/AllExceptionsFilter';
import Qs from 'fastify-qs';

class App
{
  constructor(private app:  NestFastifyApplication) {}

  init()
  {
    this.app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }]
    });
  }

  async initMiddleware(): Promise<void>
  {
    await this.app.register(Compression as any);
    await this.app.register(Qs as any);
    await this.app.register(FastifyMultipart as any);
  }

  useGlobalFilters()
  {
    this.app.useGlobalFilters(new AllExceptionsFilter());
  }

  async listen(port: number): Promise<void>
  {
     await this.app.listen(port);
  }
}

export default App;
