import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private jwtService;
    private configService;
    private supabase;
    constructor(jwtService: JwtService, configService: ConfigService);
    validateSupabaseToken(token: string): Promise<any>;
    generateJwt(payload: {
        sub: string;
        email?: string;
    }): Promise<string>;
}
