import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ example: 'Updated scouting notes...' })
  @IsString()
  @MinLength(5)
  content: string;
}
