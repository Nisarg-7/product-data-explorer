import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScrapeService } from '../services/scrape.service';
import {
  RefreshScrapeDto,
  ScrapeJobResponseDto,
} from '../dto/scrape.dto';

@ApiTags('Scraping')
@Controller('api/scrape')
export class ScrapeController {
  constructor(private scrapeService: ScrapeService) {}

  @Post('refresh')
  @ApiOperation({
    summary: 'Manually trigger scrape refresh',
    description:
      'Enqueues scrape job for product, category, or navigation. Returns job ID for tracking.',
  })
  @ApiResponse({
    status: 201,
    description: 'Scrape job created',
    type: ScrapeJobResponseDto,
  })
  @HttpCode(201)
  async triggerRefresh(
    @Body() data: RefreshScrapeDto,
  ): Promise<ScrapeJobResponseDto> {
    return this.scrapeService.triggerScrapeRefresh(data);
  }

  @Get('job/:jobId')
  @ApiOperation({
    summary: 'Get scrape job status',
    description: 'Returns status of a scrape job',
  })
  @ApiResponse({
    status: 200,
    description: 'Scrape job status',
    type: ScrapeJobResponseDto,
  })
  @HttpCode(200)
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<ScrapeJobResponseDto> {
    return this.scrapeService.getScrapeJobStatus(jobId);
  }
}
