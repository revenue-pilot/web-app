import { Controller, Post, Get, Put, Body, Req, UseGuards, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  createOrganization(@Req() req: any, @Body() body: { name: string, domain?: string }) {
    return this.organizationsService.createOrganization(req.user.id, body);
  }

  @Get('me')
  getMyOrganization(@Req() req: any) {
    return this.organizationsService.getMyOrganization(req.user.id);
  }

  @Get('team')
  getTeamMembers(@Req() req: any) {
    return this.organizationsService.getTeamMembers(req.user.organizationId);
  }

  @Put('team/:userId/role')
  assignRole(@Req() req: any, @Param('userId') userId: string, @Body() body: { role: 'ADMIN' | 'AGENCY' | 'CLIENT' }) {
    return this.organizationsService.assignRole(req.user.id, userId, body.role);
  }
}
