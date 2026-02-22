import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto, SubmitAnswerDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
    constructor(private prisma: PrismaService) { }

    async startSession(dto: StartSessionDto, userId: string, ip?: string, userAgent?: string) {
        // Check if exam exists
        const exam = await this.prisma.exam.findUnique({
            where: { id: dto.examId },
            include: { _count: { select: { questions: true } } },
        });

        if (!exam) throw new NotFoundException('Exam not found');
        if (exam.status !== 'PUBLISHED' && exam.status !== 'ACTIVE') {
            throw new BadRequestException('Exam is not available');
        }

        // Check for existing active session
        const existingSession = await this.prisma.examSession.findUnique({
            where: {
                userId_examId: { userId, examId: dto.examId },
            },
        });

        if (existingSession) {
            if (existingSession.status === 'IN_PROGRESS') {
                // Return existing session 
                return this.getSessionWithDetails(existingSession.id);
            }
            if (existingSession.status === 'COMPLETED') {
                throw new ConflictException('You have already completed this exam');
            }
        }

        // Create new session
        const session = await this.prisma.examSession.create({
            data: {
                userId,
                examId: dto.examId,
                status: 'IN_PROGRESS',
                startTime: new Date(),
                ipAddress: ip || 'unknown',
                userAgent: userAgent || 'unknown',
                deviceFingerprint: dto.deviceFingerprint || 'unknown',
            },
        });

        return this.getSessionWithDetails(session.id);
    }

    async submitAnswer(sessionId: string, dto: SubmitAnswerDto, userId: string) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.userId !== userId) throw new BadRequestException('Not your session');
        if (session.status !== 'IN_PROGRESS') throw new BadRequestException('Session is not active');

        // Check time limit
        const exam = await this.prisma.exam.findUnique({ where: { id: session.examId } });
        if (exam && session.startTime) {
            const elapsed = (Date.now() - session.startTime.getTime()) / 1000 / 60;
            if (elapsed > exam.timeLimit) {
                await this.endSession(sessionId, userId);
                throw new BadRequestException('Time limit exceeded');
            }
        }

        // Get the question to check answer
        const question = await this.prisma.question.findUnique({
            where: { id: dto.questionId },
        });

        if (!question) throw new NotFoundException('Question not found');

        const isCorrect = question.answer.toLowerCase().trim() === dto.response.toLowerCase().trim();

        // Upsert answer
        const answer = await this.prisma.answer.upsert({
            where: {
                sessionId_questionId: { sessionId, questionId: dto.questionId },
            },
            update: {
                response: dto.response,
                timeTakenMs: dto.timeTakenMs || 0,
                isCorrect,
            },
            create: {
                sessionId,
                questionId: dto.questionId,
                response: dto.response,
                timeTakenMs: dto.timeTakenMs || 0,
                isCorrect,
            },
        });

        // Check for abnormally fast answers (potential cheating)
        if (dto.timeTakenMs && dto.timeTakenMs < 2000) {
            await this.addSuspicionScore(sessionId, 10, 'abnormally_fast_answer', {
                questionId: dto.questionId,
                timeTakenMs: dto.timeTakenMs,
            });
        }

        return answer;
    }

    async endSession(sessionId: string, userId: string) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                answers: { include: { question: true } },
                exam: true,
            },
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.userId !== userId) throw new BadRequestException('Not your session');

        // Calculate score
        let totalPoints = 0;
        let earnedPoints = 0;

        session.answers.forEach((answer) => {
            totalPoints += answer.question.points;
            if (answer.isCorrect) {
                earnedPoints += answer.question.points;
            }
        });

        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = percentage >= (session.exam.passingScore || 50);

        // Get flags count
        const flagsCount = await this.prisma.proctorEvent.count({
            where: { sessionId },
        });

        // Update session
        await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                endTime: new Date(),
                riskLevel: this.calculateRiskLevel(session.suspicionScore),
            },
        });

        // Create result
        const result = await this.prisma.examResult.upsert({
            where: { sessionId },
            update: {
                score: earnedPoints,
                totalPoints,
                percentage,
                passed,
                flagsCount,
            },
            create: {
                sessionId,
                score: earnedPoints,
                totalPoints,
                percentage,
                passed,
                flagsCount,
            },
        });

        return {
            result,
            suspicionScore: session.suspicionScore,
            riskLevel: this.calculateRiskLevel(session.suspicionScore),
        };
    }

    async getSessionWithDetails(sessionId: string) {
        return this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                exam: {
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
                },
                answers: {
                    select: {
                        questionId: true,
                        response: true,
                        timeTakenMs: true,
                    },
                },
                events: {
                    orderBy: { timestamp: 'desc' },
                    take: 50,
                },
            },
        });
    }

    async getSessionForProctor(sessionId: string) {
        return this.prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                exam: { select: { id: true, title: true, timeLimit: true } },
                events: { orderBy: { timestamp: 'desc' } },
                answers: { include: { question: { select: { content: true } } } },
                result: true,
            },
        });
    }

    async getActiveSessions(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.examSession.findMany({
            where: {
                status: 'IN_PROGRESS',
                exam: { organizationId: user.organizationId },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                exam: { select: { id: true, title: true, timeLimit: true } },
                _count: { select: { events: true } },
            },
            orderBy: { startTime: 'desc' },
        });
    }

    async getAllSessions(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.examSession.findMany({
            where: {
                exam: { organizationId: user.organizationId },
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                exam: { select: { id: true, title: true } },
                result: true,
                _count: { select: { events: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addSuspicionScore(
        sessionId: string,
        weight: number,
        eventType: string,
        metadata: any = {},
    ) {
        const severity = weight >= 30 ? 'CRITICAL' : weight >= 20 ? 'HIGH' : weight >= 15 ? 'MEDIUM' : 'LOW';

        // Create event
        await this.prisma.proctorEvent.create({
            data: {
                sessionId,
                eventType,
                severity: severity as any,
                weight,
                metadata,
            },
        });

        // Update suspicion score
        const session = await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                suspicionScore: { increment: weight },
            },
        });

        // Update risk level
        await this.prisma.examSession.update({
            where: { id: sessionId },
            data: {
                riskLevel: this.calculateRiskLevel(session.suspicionScore),
            },
        });

        return { suspicionScore: session.suspicionScore, eventType, severity };
    }

    private calculateRiskLevel(score: number): string {
        if (score >= 71) return 'high_risk';
        if (score >= 31) return 'review';
        return 'clean';
    }
}
