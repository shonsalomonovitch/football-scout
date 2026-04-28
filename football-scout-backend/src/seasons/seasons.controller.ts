import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('seasons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all seasons, optionally search by name' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    if (search) return this.seasonsService.search(search);
    return this.seasonsService.findAll();
  }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Get all seasons a team has played in' })
  findByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.seasonsService.findByTeam(teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get season by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.seasonsService.findOne(id);
  }
}
