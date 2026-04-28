import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsInt, IsString, Min, Max } from 'class-validator';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class GuessWhoareyaDto {
  @IsInt() @Min(1)
  playerId: number;

  @IsString()
  puzzleId: string;

  @IsInt() @Min(1) @Max(8)
  guessNumber: number;
}

class ValidateBox2boxDto {
  @IsInt() @Min(1)
  playerId: number;

  @IsInt() @Min(0) @Max(2)
  rowIndex: number;

  @IsInt() @Min(0) @Max(2)
  colIndex: number;

  @IsString()
  puzzleId: string;
}

class ValidateBingoDto {
  @IsInt() @Min(1)
  playerId: number;

  @IsInt() @Min(1)
  categoryId: number;

  @IsString()
  puzzleId: string;
}

class WildcardBingoDto {
  @IsInt() @Min(1)
  playerId: number;

  @IsString()
  puzzleId: string;
}

@ApiTags('games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // ─── Shared ──────────────────────────────────────────────────────────────

  @Get('pool')
  @ApiOperation({ summary: 'Get the full player pool (top scorers from big 5 leagues)' })
  getPool() {
    return this.gamesService.getPool();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search players in the pool by name' })
  @ApiQuery({ name: 'q', required: true, description: 'Player name query' })
  search(@Query('q') q: string) {
    return this.gamesService.searchPool(q);
  }

  // ─── Who Are Ya? ──────────────────────────────────────────────────────────

  @Get('whoareya/daily')
  @ApiOperation({ summary: "Get today's Who Are Ya puzzle — same player for all users all day" })
  getWhoareyaDaily() {
    return this.gamesService.getWhoareyaDaily();
  }

  @Get('whoareya/random')
  @ApiOperation({ summary: 'Get a new random Who Are Ya puzzle — different every call' })
  getWhoareyaRandom() {
    return this.gamesService.getWhoareyaRandom();
  }


  @Post('whoareya/guess')
  @ApiOperation({ summary: 'Submit a guess for Who Are Ya' })
  guessWhoareya(@Body() dto: GuessWhoareyaDto) {
    return this.gamesService.guessWhoareya(dto.playerId, dto.puzzleId, dto.guessNumber);
  }

  // ─── Box2Box ──────────────────────────────────────────────────────────────

  @Get('box2box/daily')
  @ApiOperation({ summary: "Get today's Box2Box grid — same for all users all day" })
  getBox2boxDaily() {
    return this.gamesService.getBox2boxDaily();
  }

  @Get('box2box/random')
  @ApiOperation({ summary: 'Get a new random Box2Box grid — different every call' })
  getBox2boxRandom() {
    return this.gamesService.getBox2boxRandom();
  }

  @Post('box2box/validate')
  @ApiOperation({ summary: 'Validate a player answer for a Box2Box cell' })
  validateBox2box(@Body() dto: ValidateBox2boxDto) {
    return this.gamesService.validateBox2box(
      dto.playerId,
      dto.rowIndex,
      dto.colIndex,
      dto.puzzleId,
    );
  }

  // ─── Football Bingo ───────────────────────────────────────────────────────

  @Get('bingo/daily')
  @ApiOperation({ summary: "Get today's Football Bingo card and player sequence" })
  getBingoDaily() {
    return this.gamesService.getBingoDaily();
  }

  @Get('bingo/random')
  @ApiOperation({ summary: 'Get a new random Football Bingo card — different every call' })
  getBingoRandom() {
    return this.gamesService.getBingoRandom();
  }

  @Post('bingo/validate')
  @ApiOperation({ summary: 'Validate a player answer for a Bingo category' })
  validateBingo(@Body() dto: ValidateBingoDto) {
    return this.gamesService.validateBingo(dto.playerId, dto.categoryId, dto.puzzleId);
  }

  @Post('bingo/wildcard')
  @ApiOperation({ summary: 'Return all category IDs a player matches — for wildcard use' })
  wildcardBingo(@Body() dto: WildcardBingoDto) {
    return this.gamesService.wildcardBingo(dto.playerId, dto.puzzleId);
  }
}
