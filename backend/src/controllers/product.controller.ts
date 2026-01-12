import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { HistoryService } from '../services/history.service';
import {
  ProductDetailResponseDto,
  PaginatedProductsDto,
} from '../dto/product.dto';

@ApiTags('Products')
@Controller('api/products')
export class ProductController {
  constructor(
    private productService: ProductService,
    private historyService: HistoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated products',
    description:
      'Returns product grid for a category with pagination and staleness info',
  })
  @ApiQuery({
    name: 'categoryId',
    type: 'number',
    required: true,
    description: 'Category ID',
  })
  @ApiQuery({
    name: 'page',
    type: 'number',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated products',
    type: PaginatedProductsDto,
  })
  @HttpCode(200)
  async getProducts(
    @Query('categoryId', ParseIntPipe) categoryId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ): Promise<PaginatedProductsDto> {
    return this.productService.getProducts(categoryId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product detail',
    description:
      'Returns full product detail with reviews and recommendations. Triggers detail scrape if stale (>7d)',
  })
  @ApiResponse({
    status: 200,
    description: 'Product detail with reviews and recommendations',
    type: ProductDetailResponseDto,
  })
  @HttpCode(200)
  async getProductDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductDetailResponseDto> {
    return this.productService.getProductDetail(id);
  }
}

// Also export singular version at /api/product/:id for compatibility
@ApiTags('Products')
@Controller('api/product')
export class ProductSingularController {
  constructor(private productService: ProductService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get product detail (singular endpoint)',
    description: 'Alias for /api/products/:id',
  })
  @ApiResponse({
    status: 200,
    description: 'Product detail with reviews and recommendations',
    type: ProductDetailResponseDto,
  })
  @HttpCode(200)
  async getProductDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductDetailResponseDto> {
    return this.productService.getProductDetail(id);
  }
}
