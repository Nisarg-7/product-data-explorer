import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateCategoryDto {
  @IsInt()
  navigationId: number;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CategoryResponseDto {
  id: number;
  navigationId: number;
  parentId: number | null;
  title: string;
  slug: string;
  description: string | null;
  productCount: number;
  lastScrapedAt: Date | null;
  createdAt: Date;
}

export class CategoryHierarchyDto extends CategoryResponseDto {
  children?: CategoryHierarchyDto[];
  staleness: 'fresh' | 'stale' | 'missing';
}
