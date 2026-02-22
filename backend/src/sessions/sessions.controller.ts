import {
    Controller, Get, Post, Body, Param, UseGuards, Request, Ip, Headers,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { StartSessionDto, SubmitAnswerDto } from './dto/session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
    constructor(private sessionsService: SessionsService) { }

    @Post('start')
    async startSession(
        @Body() dto: StartSessionDto,
        @Request() req: any,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        return this.sessionsService.startSession(dto, req.user.sub, ip, userAgent);
    }

    @Post(':id/answer')
    async submitAnswer(
        @Param('id') id: string,
        @Body() dto: SubmitAnswerDto,
        @Request() req: any,
    ) {
        return this.sessionsService.submitAnswer(id, dto, req.user.sub);
    }

    @Post(':id/end')
    async endSession(@Param('id') id: string, @Request() req: any) {
        return this.sessionsService.endSession(id, req.user.sub);
    }

    @Get(':id')
    async getSession(@Param('id') id: string) {
        return this.sessionsService.getSessionWithDetails(id);
    }

    @Get(':id/proctor')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'PROCTOR')
    async getSessionForProctor(@Param('id') id: string) {
        return this.sessionsService.getSessionForProctor(id);
    }

    @Get('active/all')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'PROCTOR')
    async getActiveSessions(@Request() req: any) {
        return this.sessionsService.getActiveSessions(req.user.sub);
    }

    @Get('history/all')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'PROCTOR')
    async getAllSessions(@Request() req: any) {
        return this.sessionsService.getAllSessions(req.user.sub);
    }
}
