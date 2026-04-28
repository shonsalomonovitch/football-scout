import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('countries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all countries, optionally search by name' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    if (search) return this.countriesService.search(search);
    return this.countriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.countriesService.findOne(id);
  }
}
