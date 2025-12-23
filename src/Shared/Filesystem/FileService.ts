import { extname } from 'path';

import { Injectable } from '@nestjs/common';
import { IFileService } from '@shared/Filesystem/IFileService';

interface Config {
    bucket: string;
    host: string;
    port: string;
    rootPath: string;
    protocol: string;
}

@Injectable()
class FileService implements IFileService
{
    constructor(private readonly config: Config) {}

    addNewFilePath(id: string, version: number, filename: string): string
    {
        return `${id}/${version}/${filename}`;
    }

    convertToUrlFriendly(filename: string): string
    {
        return filename
          .toLowerCase()
          .replace(/[\s_]+/g, '-')
          .replace(/[^\w\-.]+/g, '')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/\.+/g, '.');
    }

    getFileExtension(filename: string): string | null
    {
        const ext = extname(filename);
        return ext ? ext.slice(1) : null;
    }

    setFullPathToFile(file: any): any
    {
        const { bucket, host, port, rootPath, protocol } = this.config;
        file.path = `${protocol}://${host}${port ? `:${port}` : ''}/${bucket}/${rootPath}/${file.path}`;

        return file;
    }
}

export default FileService;
