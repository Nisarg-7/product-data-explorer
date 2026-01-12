import {
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';

export class RefreshScrapeDto {
  @IsString()
  targetType: 'NAVIGATION' | 'CATEGORY' | 'PRODUCT_LIST' | 'PRODUCT_DETAIL';

  @IsOptional()
  @IsInt()
  navigationId?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  productId?: number;
}

export class ScrapeJobResponseDto {
  id: string;
  targetUrl: string;
  targetType: string;
  status: string;
  retryCount: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  errorLog: string | null;
  createdAt: Date;
}
