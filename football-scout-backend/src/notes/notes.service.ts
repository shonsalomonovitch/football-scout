import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.playerNote.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const note = await this.prisma.playerNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException('Access denied');
    return note;
  }

  async create(userId: number, dto: CreateNoteDto) {
    return this.prisma.playerNote.create({
      data: {
        userId,
        apiPlayerId: dto.apiPlayerId,
        playerName: dto.playerName,
        content: dto.content,
      },
    });
  }

  async update(id: number, userId: number, dto: UpdateNoteDto) {
    await this.findOne(id, userId);
    return this.prisma.playerNote.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.prisma.playerNote.delete({ where: { id } });
  }
}
