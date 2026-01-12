import { Module } from '@nestjs/common';

@Module({
  exports: [],
})
export class QueueModule {}

// Note: BullMQ integration to be added in Phase 7
// For now, we use simple job scheduling via Prisma
