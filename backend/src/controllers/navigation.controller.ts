import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NavigationService } from '../services/navigation.service';
import { NavigationDetailDto } from '../dto/navigation.dto';

@ApiTags('Navigation')
@Controller('api/navigation')
export class NavigationController {
  constructor(private navigationService: NavigationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all navigation headings',
    description:
      'Returns top-level navigation items. Triggers scrape if missing or stale (>24h)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of navigation headings',
    type: [NavigationDetailDto],
  })
  @HttpCode(200)
  async getNavigation(): Promise<NavigationDetailDto[]> {
    return this.navigationService.getNavigation();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single navigation heading',
    description: 'Returns navigation with category count and staleness info',
  })
  @ApiResponse({
    status: 200,
    description: 'Navigation detail',
    type: NavigationDetailDto,
  })
  @HttpCode(200)
  async getNavigationById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NavigationDetailDto> {
    return this.navigationService.getNavigationById(id);
  }
}
