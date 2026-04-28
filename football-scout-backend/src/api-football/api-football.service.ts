import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface SportmonksResponse<T> {
  data: T;
  pagination?: {
    count: number;
    per_page: number;
    current_page: number;
    next_page: string | null;
    has_more: boolean;
  };
  rate_limit?: unknown;
  timezone?: string;
  subscription?: unknown;
}

@Injectable()
export class ApiFootballService {
  private readonly logger = new Logger(ApiFootballService.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('sportmonks.baseUrl')!;
    this.apiToken = this.configService.get<string>('sportmonks.token')!;
  }

  async get<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    baseOverride?: string,
  ): Promise<T> {
    const base = baseOverride ?? this.baseUrl;
    const url = `${base}/${endpoint}`;
    this.logger.debug(`GET ${url} params=${JSON.stringify(params)}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<SportmonksResponse<T>>(url, {
          params: { ...params, api_token: this.apiToken },
        }),
      );
      return response.data.data;
    } catch (err) {
      throw this.wrapError(err);
    }
  }

  async getAll(
    endpoint: string,
    params: Record<string, unknown> = {},
    batchSize = 10,
  ): Promise<unknown[]> {
    const url = `${this.baseUrl}/${endpoint}`;
    const all: unknown[] = [];
    let startPage = 1;

    const fetchPage = async (page: number) => {
      const response = await firstValueFrom(
        this.httpService.get<SportmonksResponse<unknown[]>>(url, {
          params: { ...params, api_token: this.apiToken, page },
        }),
      );
      return response.data;
    };

    while (true) {
      const pages = Array.from({ length: batchSize }, (_, i) => startPage + i);
      this.logger.debug(`GET ${url} pages=${pages[0]}-${pages[pages.length - 1]} (parallel)`);

      const results = await Promise.all(pages.map((p) => fetchPage(p).catch(() => null)));

      let done = false;
      for (const result of results) {
        if (!result || !result.data?.length) { done = true; break; }
        all.push(...result.data);
        if (!result.pagination?.has_more) { done = true; break; }
      }

      if (done) break;
      startPage += batchSize;
    }

    return all;
  }

  private wrapError(err: unknown): HttpException {
    if (err instanceof HttpException) return err;

    const error = err as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };

    if (error.response?.status === 401) {
      return new HttpException('Invalid Sportmonks API token', HttpStatus.UNAUTHORIZED);
    }
    if (error.response?.status === 403) {
      return new HttpException('Insufficient Sportmonks plan for this endpoint', HttpStatus.FORBIDDEN);
    }
    if (error.response?.status === 429) {
      return new HttpException('Sportmonks rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    this.logger.error(`Sportmonks request failed: ${(error as { message?: string }).message ?? 'unknown error'}`);
    return new HttpException('External API request failed', HttpStatus.BAD_GATEWAY);
  }
}
