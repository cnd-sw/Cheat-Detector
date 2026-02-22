import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, IsArray, IsEnum, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionDto {
    @IsEnum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'])
    type: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsArray()
    options?: string[];

    @IsString()
    answer: string;

    @IsNumber()
    @IsOptional()
    points?: number;

    @IsInt()
    @IsOptional()
    order?: number;
}

export class CreateExamDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(1)
    timeLimit: number; // minutes

    @IsBoolean()
    @IsOptional()
    randomize?: boolean;

    @IsBoolean()
    @IsOptional()
    shuffleOptions?: boolean;

    @IsNumber()
    @IsOptional()
    passingScore?: number;

    @IsInt()
    @IsOptional()
    maxAttempts?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions?: CreateQuestionDto[];

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}

export class UpdateExamDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    timeLimit?: number;

    @IsBoolean()
    @IsOptional()
    randomize?: boolean;

    @IsBoolean()
    @IsOptional()
    shuffleOptions?: boolean;

    @IsNumber()
    @IsOptional()
    passingScore?: number;

    @IsOptional()
    @IsString()
    status?: string;
}
