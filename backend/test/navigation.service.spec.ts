import { Test, TestingModule } from '@nestjs/testing';
import { NavigationService } from '../src/services/navigation.service';
import { PrismaService } from '../src/common/prisma.service';
import { ScrapeService } from '../src/services/scrape.service';
import { LoggerService } from '../src/common/logger.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NavigationService,
        {
          provide: PrismaService,
          useValue: {
            navigation: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ScrapeService,
          useValue: {
            enqueueNavigationScrape: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NavigationService>(NavigationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return navigation list with staleness info', async () => {
    const mockNav = [
      {
        id: 1,
        title: 'Books',
        slug: 'books',
        description: null,
        lastScrapedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        createdAt: new Date(),
        categories: [],
      },
    ];

    jest.spyOn(prisma.navigation, 'findMany').mockResolvedValue(mockNav as any);

    const result = await service.getNavigation();

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('staleness', 'fresh'); // Recent data
    expect(result[0]).toHaveProperty('categoryCount', 0);
  });

  it('should mark data as stale if older than TTL', async () => {
    const mockNav = [
      {
        id: 1,
        title: 'Books',
        slug: 'books',
        description: null,
        lastScrapedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        createdAt: new Date(),
        categories: [],
      },
    ];

    jest.spyOn(prisma.navigation, 'findMany').mockResolvedValue(mockNav as any);

    const result = await service.getNavigation();

    expect(result[0]).toHaveProperty('staleness', 'stale'); // Older than 24h TTL
  });
});
