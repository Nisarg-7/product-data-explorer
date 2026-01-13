import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LoggerService } from '../common/logger.service';
import { TrackViewDto } from '../dto/history.dto';

@Injectable()
export class HistoryService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Track a page view
   */
  async trackView(data: TrackViewDto, productId?: number): Promise<void> {
    this.logger.debug(
      `Tracking view for session ${data.sessionId}, path ${data.path}`,
      'HistoryService',
    );

    await this.prisma.viewHistory.create({
      data: {
        sessionId: data.sessionId,
        productId,
        pathJson: JSON.stringify({
          path: data.path,
          timestamp: new Date(),
        }),
        referer: data.referer,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Get session history
   */
  async getSessionHistory(sessionId: string) {
    this.logger.log(
      `Fetching history for session ${sessionId}`,
      'HistoryService',
    );

    const views = await this.prisma.viewHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return {
      sessionId,
      views: views.map((v: any) => ({
        id: v.id,
        sessionId: v.sessionId,
        path: (v.pathJson as any).path,
        timestamp: (v.pathJson as any).timestamp || v.createdAt,
      })),
      totalViews: views.length,
    };
  }

  /**
   * Clear old history (older than 30 days)
   */
  async clearOldHistory(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await this.prisma.viewHistory.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    this.logger.log('Cleared old view history', 'HistoryService');
  }
}
