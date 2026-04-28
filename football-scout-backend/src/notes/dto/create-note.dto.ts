import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsNotEmpty, Min, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 276, description: 'API-FOOTBALL player ID' })
  @IsInt()
  @Min(1)
  apiPlayerId: number;

  @ApiProperty({ example: 'Neymar Jr' })
  @IsString()
  @IsNotEmpty()
  playerName: string;

  @ApiProperty({ example: 'Excellent dribbling, weak in the air. Worth scouting for attacking mid role.' })
  @IsString()
  @MinLength(5)
  content: string;
}
