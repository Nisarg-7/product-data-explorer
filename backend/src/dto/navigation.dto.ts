import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateNavigationDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class NavigationResponseDto {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  lastScrapedAt: Date | null;
  createdAt: Date;
}

export class NavigationDetailDto extends NavigationResponseDto {
  categoryCount: number;
  staleness: 'fresh' | 'stale' | 'missing';
}
