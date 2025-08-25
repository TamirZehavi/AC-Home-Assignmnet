import { API, Common } from '@ac-assignment/shared-types';
import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { EncryptionUtil } from 'src/common/utils/encryption.util';
import { UploadService } from 'src/files/services/upload.service';

@Controller(API.Controllers.Jobs)
export class JobsController {
  constructor(
    private encryptionUtil: EncryptionUtil,
    private uploadService: UploadService,
  ) {}
  @Get(`${API.Endpoints.JobStatus}/:jobId`)
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<API.JobStatusResponse> {
    const id = this.encryptionUtil.decrypt(jobId);
    const job = await this.uploadService.getJob(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    switch (job.status) {
      case Common.LoadingStatus.Loading:
        res.status(HttpStatus.ACCEPTED);
        break;
      case Common.LoadingStatus.Success:
        res.status(HttpStatus.OK);
        break;
      case Common.LoadingStatus.Error:
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
        break;
    }
    return { status: job.status };
  }
}
