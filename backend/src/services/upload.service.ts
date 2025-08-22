import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Upload } from '../entities/upload.entity';

export interface CreateUploadDto {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface UpdateUploadParsingDto {
  jsonFilePath?: string;
  isParsed: boolean;
  rowCount?: number;
  parseError?: string;
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

  async updateUploadParsing(id: number, updateDto: UpdateUploadParsingDto): Promise<Upload | null> {
    this.logger.log(`Updating parsing info for upload ID: ${id}`);
    
    await this.uploadRepository.update(id, updateDto);
    const updatedUpload = await this.uploadRepository.findOne({ where: { id } });
    
    this.logger.log(`Upload parsing info updated for ID: ${id}`);
    return updatedUpload;
  }

  async findAll(): Promise<Upload[]> {
    return this.uploadRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Upload | null> {
    return this.uploadRepository.findOne({ where: { id } });
  }

  async findByFilename(filename: string): Promise<Upload | null> {
    return this.uploadRepository.findOne({ where: { filename } });
  }

  async getUploadStats() {
    const total = await this.uploadRepository.count();
    const parsed = await this.uploadRepository.count({ where: { isParsed: true } });
    const failed = await this.uploadRepository.count({ 
      where: { isParsed: false, parseError: IsNull() } 
    });

    return {
      total,
      parsed,
      failed,
      pending: total - parsed - failed
    };
  }
}
