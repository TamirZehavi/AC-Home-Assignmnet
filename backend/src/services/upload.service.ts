import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Upload } from '../entities/upload.entity';

export interface CreateUploadDto {
  originalName: string;
  filename: string;
  fileHash: string;
}

export interface UpdateUploadParsingDto {
  originalName: string;
  fileName: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
  ) {}

  async createUpload(createUploadDto: CreateUploadDto): Promise<Upload> {
    this.logger.log(`Creating upload record: ${createUploadDto.originalName}`);

    const upload = this.uploadRepository.create(createUploadDto);
    const savedUpload = await this.uploadRepository.save(upload);

    this.logger.log(`Upload record created with ID: ${savedUpload.id}`);
    return savedUpload;
  }

  async findAll(): Promise<Upload[]> {
    return this.uploadRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Upload | null> {
    return this.uploadRepository.findOne({ where: { id } });
  }

  async addOne(upload: Upload): Promise<Upload | null> {
    return this.uploadRepository.save(upload);
  }

  async deleteOne(id: number): Promise<Upload | null> {
    const upload = await this.uploadRepository.findOne({ where: { id } });
    if (upload) {
      await this.uploadRepository.remove(upload);
    }
    return upload;
  }

  async deleteAll(): Promise<void> {
    await this.uploadRepository.clear();
  }

  async findFileByHash(fileHash: string): Promise<Upload | null> {
    return this.uploadRepository.findOne({ where: { fileHash } });
  }

  async getUploadStats() {
    const total = await this.uploadRepository.count();
    return { total };
  }
}
