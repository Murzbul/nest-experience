import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FileService from '@shared/Filesystem/FileService';
import { IFileService } from '@shared/Filesystem/IFileService';
import ProviderFilesystem from '@shared/Filesystem/ProviderFilesystem';
import { TransactionHelper } from '@shared/UnitOfWork/TransactionHelper';
import { TransactionManager } from '@shared/UnitOfWork/TransactionManager';

@Global()
@Module({
  providers: [
    ProviderFilesystem,
    TransactionManager,
    TransactionHelper,
    {
      provide: IFileService,
      useFactory: async(configService: ConfigService) =>
      {
        const config = {
          bucket: configService.get<string>('FILESYSTEM_BUCKET'),
          host: configService.get<string>('FILESYSTEM_HOST'),
          port: configService.get<string>('FILESYSTEM_PORT'),
          rootPath: configService.get<string>('FILESYSTEM_ROOT_PATH'),
          protocol: configService.get<string>('FILESYSTEM_PROTOCOL')
        };

        return new FileService(config);
      },
      inject: [ConfigService]
    }
  ],
  exports: [
    ProviderFilesystem,
    IFileService,
    TransactionManager,
    TransactionHelper
  ]
})
export class SharedModule {}
