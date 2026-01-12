import {
  IsString,
  IsOptional,
  IsInt,
  IsDecimal,
  IsUrl,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  sourceId: string;

  @IsUrl()
  sourceUrl: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsDecimal()
  price?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsInt()
  categoryId: number;
}

export class ProductResponseDto {
  id: number;
  sourceId: string;
  sourceUrl: string;
  title: string;
  author: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  categoryId: number;
  lastScrapedAt: Date | null;
  createdAt: Date;
}

export class ProductGridDto extends ProductResponseDto {
  staleness: 'fresh' | 'stale' | 'missing';
}

export class ProductDetailResponseDto {
  product: ProductResponseDto;
  detail: {
    description: string | null;
    isbn: string | null;
    publisher: string | null;
    publicationDate: Date | null;
    pages: number | null;
    specs: any;
    ratingsAvg: number | null;
    reviewsCount: number;
  };
  reviews: Array<{
    id: number;
    author: string | null;
    rating: number;
    text: string | null;
  }>;
  recommendations: ProductResponseDto[];
}

export class PaginatedProductsDto {
  items: ProductGridDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
