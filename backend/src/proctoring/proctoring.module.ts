import { Module } from '@nestjs/common';
import { ProctoringGateway } from './proctoring.gateway';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
    imports: [AuthModule, SessionsModule],
    providers: [ProctoringGateway],
    exports: [ProctoringGateway],
})
export class ProctoringModule { }
