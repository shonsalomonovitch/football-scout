import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoachesService } from './coaches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('coaches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all coaches or search by name' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    if (search) return this.coachesService.search(search);
    return this.coachesService.findAll();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get recently updated coaches (last 2 hours)' })
  getLatestUpdated() {
    return this.coachesService.getLatestUpdated();
  }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Get coaches for a specific team' })
  findByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.coachesService.findByTeam(teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get coach by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coachesService.findOne(id);
  }
}
