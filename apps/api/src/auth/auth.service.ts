import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: { organization: true }
    });
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        if (!user.isEmailVerified) {
          throw new UnauthorizedException('Email not verified');
        }
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role, 
      organizationId: user.organizationId,
      isOnboarded: user.organization?.isOnboarded || false
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async googleLogin(credential: string) {
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new BadRequestException('Invalid Google token');
      }

      const email = payload.email.toLowerCase();
      const name = payload.name;
      const providerUserId = payload.sub;

      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (!user) {
        // Create organization
        const organization = await this.prisma.organization.create({
          data: {
            name: `${name.split(' ')[0]}'s Workspace`,
            isOnboarded: false,
          },
        });

        // Create user
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            firstName: payload.given_name,
            lastName: payload.family_name,
            provider: 'GOOGLE',
            providerUserId,
            isEmailVerified: true,
            role: 'CLIENT',
            organizationId: organization.id,
          },
          include: { organization: true },
        });

        await this.emailService.sendWelcomeEmail(email, name);
      } else {
        // Update existing user with Google provider details if missing
        if (!user.providerUserId) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { provider: 'GOOGLE', providerUserId, isEmailVerified: true },
            include: { organization: true },
          });
        }
      }

      return this.login(user);
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async signup(data: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    const organization = await this.prisma.organization.create({
      data: {
        name: data.companyName || 'My Workspace',
      },
    });

    const verificationToken = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: organization.id,
        verificationToken,
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { message: 'Signup successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether user exists
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    const resetPasswordToken = randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken, resetPasswordExpires },
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetPasswordToken);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Password has been reset successfully.' };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedException();
      }

      const newPayload = { email: user.email, sub: user.id, role: user.role, organizationId: user.organizationId };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const secret = speakeasy.generateSecret({
      name: `RevenuePilot (${user.email})`
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 }
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl
    };
  }

  async enableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two factor secret not generated');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      throw new BadRequestException('Invalid two-factor authentication token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async verifyTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      throw new BadRequestException('Invalid two-factor authentication token');
    }

    // Generate tokens
    const payload = { email: user.email, sub: user.id, role: user.role, organizationId: user.organizationId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
    };
  }
}

