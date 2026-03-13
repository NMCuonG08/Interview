import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async requestOtp(dto: RequestOtpDto) {
    // Rate limit: max 3 OTP requests per phone per 15 minutes
    const windowMs = 15 * 60 * 1000;
    const windowStart = new Date(Date.now() - windowMs);
    const recentCount = await this.prisma.otpVerification.count({
      where: {
        phone: dto.phone,
        createdAt: { gte: windowStart },
      },
    });
    if (recentCount >= 3) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_RATE_LIMIT_EXCEEDED);
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // TODO: Here I will integrate with an SMS service to send the OTP in the future
    console.log(`[OTP-DEBUG] OTP for ${dto.phone}: ${code}`);

    await this.prisma.otpVerification.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt,
      },
    });

    return { message: AUTH_MESSAGES.OTP_SENT_SUCCESSFULLY };
  }

  async verifyOtp(dto: VerifyOtpDto, type: string) {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    const payload = { phone: dto.phone, type };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      message: AUTH_MESSAGES.OTP_VERIFIED_SUCCESSFULLY,
      verificationToken: token,
    };
  }
}
