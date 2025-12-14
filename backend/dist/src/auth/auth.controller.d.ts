import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    verifyToken(token: string): Promise<{
        user: any;
        jwt: string;
    }>;
    getProfile(req: any): any;
}
