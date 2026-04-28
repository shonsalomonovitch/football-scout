import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @ApiOperation({ summary: 'Get latest transfers' })
  findLatest() {
    return this.transfersService.findLatest();
  }

  @Get('between')
  @ApiOperation({ summary: 'Get transfers within a date range' })
  @ApiQuery({ name: 'from', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: true, description: 'YYYY-MM-DD' })
  findByDateRange(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.transfersService.findByDateRange(from, to);
  }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Get all transfers for a team' })
  findByTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.transfersService.findByTeam(teamId);
  }

  @Get('players/:playerId')
  @ApiOperation({ summary: 'Get all transfers for a player' })
  findByPlayer(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.transfersService.findByPlayer(playerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.findOne(id);
  }
}
