import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true, organization: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        timezone: data.timezone,
        avatarUrl: data.avatarUrl,
        // other fields
      },
      include: { preferences: true },
    });
    const { passwordHash, ...result } = user;
    return result;
  }

  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const secretDetails = speakeasy.generateSecret({ name: `RevenuePilot (${user.email})` });
    const secret = secretDetails.base32;
    const otpauthUrl = secretDetails.otpauth_url;

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCodeImage = await qrcode.toDataURL(otpauthUrl);
    return { qrCodeImage, secret };
  }

  async verify2FAAndEnable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA secret not generated');
    }

    const isValid = speakeasy.totp.verify({ token, secret: user.twoFactorSecret, encoding: 'base32' });
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA token');
    }

    const recoveryCodes = Array.from({ length: 8 }).map(() => randomBytes(4).toString('hex')).join(',');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: recoveryCodes,
      },
    });

    return { message: '2FA enabled successfully', recoveryCodes: recoveryCodes.split(',') };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });
    return { message: '2FA disabled successfully' };
  }
}
