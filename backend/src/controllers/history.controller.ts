import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HistoryService } from '../services/history.service';
import {
  TrackViewDto,
  SessionHistoryDto,
} from '../dto/history.dto';

@ApiTags('History')
@Controller('api/history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Post('track')
  @ApiOperation({
    summary: 'Track page view',
    description: 'Records a page view to session history',
  })
  @ApiResponse({
    status: 201,
    description: 'View tracked',
  })
  @HttpCode(201)
  async trackView(@Body() data: TrackViewDto): Promise<{ success: boolean }> {
    await this.historyService.trackView(data);
    return { success: true };
  }

  @Get('session/:sessionId')
  @ApiOperation({
    summary: 'Get session history',
    description: 'Returns browsing history for a session',
  })
  @ApiResponse({
    status: 200,
    description: 'Session history',
    type: SessionHistoryDto,
  })
  @HttpCode(200)
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionHistoryDto> {
    return this.historyService.getSessionHistory(sessionId);
  }
}
