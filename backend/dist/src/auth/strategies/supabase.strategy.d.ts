import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const SupabaseStrategy_base: new (...args: any[]) => Strategy;
export declare class SupabaseStrategy extends SupabaseStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: {
        sub?: string;
    }): Promise<{
        userId: any;
        email: any;
    }>;
}
export {};
