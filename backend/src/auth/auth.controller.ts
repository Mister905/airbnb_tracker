import { Controller, Post, Get, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerifyTokenDto } from './dto/verify-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('verify')
  async verifyToken(@Body() dto: VerifyTokenDto) {
    const user = await this.authService.validateSupabaseToken(dto.token);
    const jwt = await this.authService.generateJwt({
      sub: user.id,
      email: user.email,
    });
    return { user, jwt };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
