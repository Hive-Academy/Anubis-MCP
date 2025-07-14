import { Injectable } from '@nestjs/common';
import { DelegationRecord, Prisma } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  DelegationRecordIncludeOptions,
  IDelegationRecordRepository,
} from '../interfaces/delegation-record.repository.interface';
import {
  CreateDelegationRecordData,
  DelegationRecordOrderByInput,
  DelegationRecordWhereInput,
  DelegationRecordWithRelations,
  PrismaTransaction,
  UpdateDelegationRecordData,
} from '../types/delegation-record.types';

@Injectable()
export class DelegationRecordRepository implements IDelegationRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Basic CRUD Operations
  async findById(
    id: number,
    include?: DelegationRecordIncludeOptions,
  ): Promise<DelegationRecordWithRelations | null> {
    return this.prisma.delegationRecord.findUnique({
      where: { id },
      include: this.buildInclude(include),
    });
  }

  async findMany(options: {
    where?: DelegationRecordWhereInput;
    orderBy?: DelegationRecordOrderByInput;
    take?: number;
    skip?: number;
    include?: DelegationRecordIncludeOptions;
  }): Promise<DelegationRecordWithRelations[]> {
    const { where, orderBy, include, skip, take } = options;
    return this.prisma.delegationRecord.findMany({
      where,
      orderBy,
      take,
      skip,
      include: this.buildInclude(include),
    });
  }

  async findByTaskId(
    taskId: number,
    include?: DelegationRecordIncludeOptions,
  ): Promise<DelegationRecordWithRelations[]> {
    return this.prisma.delegationRecord.findMany({
      where: { taskId },
      include: this.buildInclude(include),
      orderBy: { delegationTimestamp: 'asc' },
    });
  }

  async create(
    data: CreateDelegationRecordData,
    include?: DelegationRecordIncludeOptions,
  ): Promise<DelegationRecordWithRelations> {
    return this.prisma.delegationRecord.create({
      data,
      include: this.buildInclude(include),
    });
  }

  async update(
    id: number,
    data: UpdateDelegationRecordData,
    include?: DelegationRecordIncludeOptions,
  ): Promise<DelegationRecordWithRelations> {
    return this.prisma.delegationRecord.update({
      where: { id },
      data,
      include: this.buildInclude(include),
    });
  }

  async delete(id: number): Promise<DelegationRecord> {
    return this.prisma.delegationRecord.delete({
      where: { id },
    });
  }

  async findByFromMode(
    fromMode: string,
    taskId?: number,
  ): Promise<DelegationRecordWithRelations[]> {
    return this.prisma.delegationRecord.findMany({
      where: {
        fromMode,
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { delegationTimestamp: 'desc' },
    });
  }

  async findByToMode(
    toMode: string,
    taskId?: number,
  ): Promise<DelegationRecordWithRelations[]> {
    return this.prisma.delegationRecord.findMany({
      where: {
        toMode,
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { delegationTimestamp: 'desc' },
    });
  }

  async findByTransition(
    fromMode: string,
    toMode: string,
    taskId?: number,
  ): Promise<DelegationRecordWithRelations[]> {
    return this.prisma.delegationRecord.findMany({
      where: {
        fromMode,
        toMode,
        ...(taskId && { taskId }),
      },
      include: { task: true },
      orderBy: { delegationTimestamp: 'desc' },
    });
  }

  // Delegation Management
  async findDelegationChain(
    taskId: number,
  ): Promise<DelegationRecordWithRelations[]> {
    return this.prisma.delegationRecord.findMany({
      where: { taskId },
      include: { task: true },
      orderBy: { delegationTimestamp: 'asc' },
    });
  }

  // Utility Operations
  async count(where?: DelegationRecordWhereInput): Promise<number> {
    return this.prisma.delegationRecord.count({ where });
  }

  async hasDelegationRecord(taskId: number): Promise<boolean> {
    const count = await this.prisma.delegationRecord.count({
      where: { taskId },
    });
    return count > 0;
  }

  // Transaction Support
  async createWithTransaction(
    data: CreateDelegationRecordData,
    tx?: PrismaTransaction,
  ): Promise<DelegationRecordWithRelations> {
    const prisma = tx || this.prisma;
    return prisma.delegationRecord.create({
      data: {
        ...data,
        message: data.message,
      },
      include: { task: true },
    });
  }

  async updateWithTransaction(
    id: number,
    data: UpdateDelegationRecordData,
    tx?: PrismaTransaction,
  ): Promise<DelegationRecordWithRelations> {
    const prisma = tx || this.prisma;
    return prisma.delegationRecord.update({
      where: { id },
      data: {
        ...data,
        message: data.message || undefined,
      },
      include: { task: true },
    });
  }

  // Private helper methods
  private buildInclude(
    include?: DelegationRecordIncludeOptions,
  ): Prisma.DelegationRecordInclude | undefined {
    if (!include) return undefined;

    return {
      task: include.task || false,
    };
  }
}
