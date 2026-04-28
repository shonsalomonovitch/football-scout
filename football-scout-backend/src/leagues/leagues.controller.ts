import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeaguesService } from './leagues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('leagues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leagues')
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leagues, optionally filtered by search or country' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'country', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('country') country?: string,
  ) {
    return this.leaguesService.findAll({ search, country });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get league by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leaguesService.findOne(id);
  }
}
