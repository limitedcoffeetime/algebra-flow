import { UpdateUserProgressInput, UserProgress } from '../models/UserProgress';

export interface IUserProgressRepository {
  // Since UserProgress is a singleton, we don't need typical CRUD operations
  get(): Promise<UserProgress | null>;
  initialize(): Promise<UserProgress>;
  update(updates: UpdateUserProgressInput): Promise<UserProgress>;
  reset(): Promise<UserProgress>;
}
