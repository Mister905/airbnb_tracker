import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('verify')
  async verifyToken(@Body('token') token: string) {
    const user = await this.authService.validateSupabaseToken(token);
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
