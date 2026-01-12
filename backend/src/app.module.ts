import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { LoggerService } from './common/logger.service';
import { NavigationController } from './controllers/navigation.controller';
import { CategoryController } from './controllers/category.controller';
import { ProductController, ProductSingularController } from './controllers/product.controller';
import { ScrapeController } from './controllers/scrape.controller';
import { HistoryController } from './controllers/history.controller';
import { NavigationService } from './services/navigation.service';
import { CategoryService } from './services/category.service';
import { ProductService } from './services/product.service';
import { ScrapeService } from './services/scrape.service';
import { HistoryService } from './services/history.service';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    QueueModule,
  ],
  controllers: [
    NavigationController,
    CategoryController,
    ProductController,
    ProductSingularController,
    ScrapeController,
    HistoryController,
  ],
  providers: [
    PrismaService,
    LoggerService,
    NavigationService,
    CategoryService,
    ProductService,
    ScrapeService,
    HistoryService,
  ],
})
export class AppModule {}
