import { IsString, IsOptional, IsUUID } from 'class-validator';

export class TrackViewDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  referer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ViewHistoryResponseDto {
  id: number;
  sessionId: string;
  path: string;
  timestamp: Date;
}

export class SessionHistoryDto {
  sessionId: string;
  views: ViewHistoryResponseDto[];
  totalViews: number;
}
