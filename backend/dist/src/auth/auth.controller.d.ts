import { AuthService } from './auth.service';
import { VerifyTokenDto } from './dto/verify-token.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    verifyToken(dto: VerifyTokenDto): Promise<{
        user: any;
        jwt: string;
    }>;
    getProfile(req: any): any;
}
