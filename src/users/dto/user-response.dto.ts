export class UserResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    bio?: string;
    avatar?: string;
    role: string;
    isVerified: boolean;
    createdAt: Date;
}
