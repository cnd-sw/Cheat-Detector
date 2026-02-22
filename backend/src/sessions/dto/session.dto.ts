import { IsString, IsOptional, IsInt } from 'class-validator';

export class StartSessionDto {
    @IsString()
    examId: string;

    @IsString()
    @IsOptional()
    deviceFingerprint?: string;
}

export class SubmitAnswerDto {
    @IsString()
    questionId: string;

    @IsString()
    response: string;

    @IsInt()
    @IsOptional()
    timeTakenMs?: number;
}
