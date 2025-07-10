export interface IBaseRepository<T> {
  findById(id: number): Promise<T | null>;
  findMany(where?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: number, data: any): Promise<T>;
  delete(id: number): Promise<void>;
  count(where?: any): Promise<number>;
}

export interface IRepositoryTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export type RepositoryOptions = {
  transaction?: any;
  include?: any;
  select?: any;
};
