import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum Role {
    ADMIN = 'ADMIN',
    PROCTOR = 'PROCTOR',
    STUDENT = 'STUDENT',
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @IsString()
    organizationName: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}
