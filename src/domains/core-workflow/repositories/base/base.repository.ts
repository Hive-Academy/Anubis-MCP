import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IBaseRepository, RepositoryOptions } from '../types/repository.types';

@Injectable()
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected abstract modelName: string;

  constructor(protected readonly prisma: PrismaService) {}

  protected getModel() {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: number, options?: RepositoryOptions): Promise<T | null> {
    return this.getModel().findUnique({
      where: { id },
      ...options,
    });
  }

  async findMany(where?: any, options?: RepositoryOptions): Promise<T[]> {
    return this.getModel().findMany({
      where,
      ...options,
    });
  }

  async create(data: any, options?: RepositoryOptions): Promise<T> {
    return this.getModel().create({
      data,
      ...options,
    });
  }

  async update(id: number, data: any, options?: RepositoryOptions): Promise<T> {
    return this.getModel().update({
      where: { id },
      data,
      ...options,
    });
  }

  async delete(id: number): Promise<void> {
    await this.getModel().delete({
      where: { id },
    });
  }

  async count(where?: any): Promise<number> {
    return this.getModel().count({ where });
  }
}
