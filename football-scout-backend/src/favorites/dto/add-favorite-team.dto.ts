import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AddFavoriteTeamDto {
  @ApiProperty({ example: 85, description: 'API-FOOTBALL team ID' })
  @IsInt()
  @Min(1)
  apiTeamId: number;

  @ApiProperty({ example: 'Paris Saint Germain' })
  @IsString()
  @IsNotEmpty()
  teamName: string;

  @ApiPropertyOptional({ example: 'Ligue 1' })
  @IsString()
  @IsOptional()
  leagueName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.sportmonks.com/images/soccer/teams/...' })
  @IsString()
  @IsOptional()
  logo?: string;
}
