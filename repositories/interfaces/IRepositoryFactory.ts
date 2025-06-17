import { IProblemBatchRepository } from './IProblemBatchRepository';
import { IProblemRepository } from './IProblemRepository';
import { IUserProgressRepository } from './IUserProgressRepository';

export interface IRepositoryFactory {
  problemRepository(): IProblemRepository;
  problemBatchRepository(): IProblemBatchRepository;
  userProgressRepository(): IUserProgressRepository;

  // Database management
  initialize(): Promise<boolean>;
  close(): Promise<void>;
}
