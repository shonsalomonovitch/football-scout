import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LivescoresService } from './livescores.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('livescores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('livescores')
export class LivescoresController {
  constructor(private readonly livescoresService: LivescoresService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get all livescores (fixtures 15 min before kickoff until 15 min after final whistle)',
  })
  getAll() {
    return this.livescoresService.getAll();
  }

  @Get('inplay')
  @ApiOperation({ summary: 'Get only currently in-play fixtures with live score and events' })
  getInplay() {
    return this.livescoresService.getInplay();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get fixtures updated in the last 10 seconds (polling endpoint)' })
  getLatestUpdated() {
    return this.livescoresService.getLatestUpdated();
  }
}
