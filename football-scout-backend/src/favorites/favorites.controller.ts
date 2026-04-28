import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddFavoritePlayerDto } from './dto/add-favorite-player.dto';
import { AddFavoriteTeamDto } from './dto/add-favorite-team.dto';

interface AuthUser {
  id: number;
}

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // --- Players ---

  @Get('players')
  @ApiOperation({ summary: 'List favorite players' })
  getPlayers(@CurrentUser() user: AuthUser) {
    return this.favoritesService.getPlayers(user.id);
  }

  @Post('players')
  @ApiOperation({ summary: 'Add a player to favorites' })
  addPlayer(@CurrentUser() user: AuthUser, @Body() dto: AddFavoritePlayerDto) {
    return this.favoritesService.addPlayer(user.id, dto);
  }

  @Delete('players/:apiPlayerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a player from favorites' })
  removePlayer(@CurrentUser() user: AuthUser, @Param('apiPlayerId', ParseIntPipe) apiPlayerId: number) {
    return this.favoritesService.removePlayer(user.id, apiPlayerId);
  }

  // --- Teams ---

  @Get('teams')
  @ApiOperation({ summary: 'List favorite teams' })
  getTeams(@CurrentUser() user: AuthUser) {
    return this.favoritesService.getTeams(user.id);
  }

  @Post('teams')
  @ApiOperation({ summary: 'Add a team to favorites' })
  addTeam(@CurrentUser() user: AuthUser, @Body() dto: AddFavoriteTeamDto) {
    return this.favoritesService.addTeam(user.id, dto);
  }

  @Delete('teams/:apiTeamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a team from favorites' })
  removeTeam(@CurrentUser() user: AuthUser, @Param('apiTeamId', ParseIntPipe) apiTeamId: number) {
    return this.favoritesService.removeTeam(user.id, apiTeamId);
  }
}
