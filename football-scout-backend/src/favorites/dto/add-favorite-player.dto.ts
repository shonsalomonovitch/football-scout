import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class AddFavoritePlayerDto {
  @ApiProperty({ example: 276, description: 'API-FOOTBALL player ID' })
  @IsInt()
  @Min(1)
  apiPlayerId: number;

  @ApiProperty({ example: 'Neymar Jr' })
  @IsString()
  @IsNotEmpty()
  playerName: string;

  @ApiPropertyOptional({ example: 'Neymar' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Paris Saint Germain' })
  @IsString()
  @IsOptional()
  teamName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.sportmonks.com/images/soccer/players/...' })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiPropertyOptional({ example: 'Forward' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsInt()
  @Min(0)
  @IsOptional()
  goals?: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  @IsOptional()
  rating?: number;
}
