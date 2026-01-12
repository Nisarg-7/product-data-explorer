import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { CategoryHierarchyDto } from '../dto/category.dto';

@ApiTags('Categories')
@Controller('api/categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get(':navigationId')
  @ApiOperation({
    summary: 'Get categories for a navigation',
    description:
      'Returns category hierarchy for a navigation heading. Triggers scrape if stale (>24h)',
  })
  @ApiResponse({
    status: 200,
    description: 'Category hierarchy with subcategories',
    type: [CategoryHierarchyDto],
  })
  @HttpCode(200)
  async getCategories(
    @Param('navigationId', ParseIntPipe) navigationId: number,
  ): Promise<CategoryHierarchyDto[]> {
    return this.categoryService.getCategories(navigationId);
  }

  @Get('detail/:id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Returns single category with hierarchy',
  })
  @ApiResponse({
    status: 200,
    description: 'Category detail',
    type: CategoryHierarchyDto,
  })
  @HttpCode(200)
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryHierarchyDto> {
    return this.categoryService.getCategoryById(id);
  }
}
