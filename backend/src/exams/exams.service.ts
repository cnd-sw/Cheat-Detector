import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';

@Injectable()
export class ExamsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateExamDto, userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new NotFoundException('User not found');

        const exam = await this.prisma.exam.create({
            data: {
                title: dto.title,
                description: dto.description,
                timeLimit: dto.timeLimit,
                randomize: dto.randomize ?? true,
                shuffleOptions: dto.shuffleOptions ?? true,
                passingScore: dto.passingScore ?? 50.0,
                maxAttempts: dto.maxAttempts ?? 1,
                organizationId: user.organizationId,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                questions: dto.questions
                    ? {
                        create: dto.questions.map((q, i) => ({
                            type: q.type as any,
                            content: q.content,
                            options: q.options || [],
                            answer: q.answer,
                            points: q.points ?? 1,
                            order: q.order ?? i,
                        })),
                    }
                    : undefined,
            },
            include: {
                questions: true,
                _count: { select: { sessions: true } },
            },
        });

        return exam;
    }

    async findAll(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new NotFoundException('User not found');

        return this.prisma.exam.findMany({
            where: { organizationId: user.organizationId },
            include: {
                questions: { select: { id: true, type: true, points: true } },
                _count: { select: { sessions: true, questions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                questions: { orderBy: { order: 'asc' } },
                _count: { select: { sessions: true } },
            },
        });

        if (!exam) throw new NotFoundException('Exam not found');
        return exam;
    }

    async findForStudent(id: string) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                questions: {
                    select: {
                        id: true,
                        type: true,
                        content: true,
                        options: true,
                        points: true,
                        order: true,
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!exam) throw new NotFoundException('Exam not found');

        // Randomize question order if enabled
        if (exam.randomize) {
            exam.questions = this.shuffleArray(exam.questions);
        }

        // Shuffle options if enabled
        if (exam.shuffleOptions) {
            exam.questions = exam.questions.map((q) => {
                if (q.options && Array.isArray(q.options)) {
                    return { ...q, options: this.shuffleArray(q.options as string[]) };
                }
                return q;
            });
        }

        return exam;
    }

    async update(id: string, dto: UpdateExamDto) {
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException('Exam not found');

        return this.prisma.exam.update({
            where: { id },
            data: {
                ...dto,
                status: dto.status as any,
            },
            include: {
                questions: true,
            },
        });
    }

    async delete(id: string) {
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam) throw new NotFoundException('Exam not found');

        await this.prisma.exam.delete({ where: { id } });
        return { message: 'Exam deleted successfully' };
    }

    async getAvailableExams(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new NotFoundException('User not found');

        const exams = await this.prisma.exam.findMany({
            where: {
                organizationId: user.organizationId,
                status: 'PUBLISHED',
            },
            include: {
                _count: { select: { questions: true } },
                sessions: {
                    where: { userId },
                    select: { id: true, status: true, suspicionScore: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return exams.map((exam) => ({
            ...exam,
            hasAttempted: exam.sessions.length > 0,
            lastSession: exam.sessions[0] || null,
        }));
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
