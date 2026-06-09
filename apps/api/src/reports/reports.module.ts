import { Module, forwardRef } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JobsModule } from '../jobs/jobs.module';
import { StorageService } from '../storage/storage.service';

@Module({
  imports: [forwardRef(() => JobsModule)],
  controllers: [ReportsController],
  providers: [
    ReportsService, 
    StorageService,
    { provide: 'ReportsService', useExisting: ReportsService }
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
