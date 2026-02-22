import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
    constructor(private examsService: ExamsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'PROCTOR')
    async create(@Body() dto: CreateExamDto, @Request() req: any) {
        return this.examsService.create(dto, req.user.sub);
    }

    @Get()
    async findAll(@Request() req: any) {
        return this.examsService.findAll(req.user.sub);
    }

    @Get('available')
    async getAvailableExams(@Request() req: any) {
        return this.examsService.getAvailableExams(req.user.sub);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.examsService.findOne(id);
    }

    @Get(':id/student')
    async findForStudent(@Param('id') id: string) {
        return this.examsService.findForStudent(id);
    }

    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'PROCTOR')
    async update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
        return this.examsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async delete(@Param('id') id: string) {
        return this.examsService.delete(id);
    }
}
