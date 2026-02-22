import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'Global Institute of Technology',
            plan: 'enterprise',
        },
    });

    // 2. Create Users
    const admin = await prisma.user.create({
        data: {
            email: 'admin@git.edu',
            password: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            role: 'ADMIN',
            organizationId: org.id,
        },
    });

    const student = await prisma.user.create({
        data: {
            email: 'student@git.edu',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Doe',
            role: 'STUDENT',
            organizationId: org.id,
        },
    });

    // 3. Create Exam
    const exam = await prisma.exam.create({
        data: {
            title: 'Advanced Computer Architecture',
            description: 'Covers pipelining, memory hierarchy, and quantitative principles of computer design.',
            timeLimit: 60,
            randomize: true,
            status: 'PUBLISHED',
            organizationId: org.id,
            questions: {
                create: [
                    {
                        type: 'MCQ',
                        content: 'What is the primary benefit of speculative execution?',
                        options: ['Lower Power', 'Increased IPC', 'Improved Security', 'Reduced Die Size'],
                        answer: 'Increased IPC',
                        points: 5,
                    },
                    {
                        type: 'MCQ',
                        content: 'Which cache level is typically closest to the processor core?',
                        options: ['L1', 'L2', 'L3', 'RAM'],
                        answer: 'L1',
                        points: 5,
                    },
                ],
            },
        },
    });

    console.log('Seed completed successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
