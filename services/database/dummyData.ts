import { v4 as uuidv4 } from 'uuid'; // We'll need a UUID generator
import { ProblemBatchInput, ProblemInput } from "./schema";

// Helper to create ISO timestamps
const now = () => new Date().toISOString();

export const DUMMY_BATCH_1_ID = `batch_${now().split('T')[0].replace(/-/g, '')}_001`; // e.g. batch_20231027_001
export const DUMMY_BATCH_2_ID = `batch_${now().split('T')[0].replace(/-/g, '')}_002`;

export const dummyProblemBatchesInput: ProblemBatchInput[] = [
  {
    id: DUMMY_BATCH_1_ID,
    generationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    sourceUrl: "s3://algebro-problems/dummy_batch_1.json",
    problemCount: 3,
  },
  {
    id: DUMMY_BATCH_2_ID,
    generationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    sourceUrl: "s3://algebro-problems/dummy_batch_2.json",
    problemCount: 2,
  },
];

export const dummyProblemsInput: ProblemInput[] = [
  // Batch 1
  {
    id: uuidv4(),
    batchId: DUMMY_BATCH_1_ID,
    equation: "2x + 5 = 15",
    answer: "5",
    solutionSteps: [
      "2x + 5 - 5 = 15 - 5",
      "2x = 10",
      "x = 10 / 2",
      "x = 5",
    ],
    difficulty: "easy",
    problemType: "linear-one-variable",
    isCompleted: false,
  },
  {
    id: uuidv4(),
    batchId: DUMMY_BATCH_1_ID,
    equation: "3y - 7 = 14",
    answer: "7",
    solutionSteps: [
      "3y - 7 + 7 = 14 + 7",
      "3y = 21",
      "y = 21 / 3",
      "y = 7",
    ],
    difficulty: "easy",
    problemType: "linear-one-variable",
    isCompleted: false,
  },
  {
    id: uuidv4(),
    batchId: DUMMY_BATCH_1_ID,
    equation: "x^2 - 4 = 0",
    answer: "2 or -2",
    solutionSteps: [
      "x^2 = 4",
      "x = sqrt(4)",
      "x = ±2",
    ],
    difficulty: "medium",
    problemType: "quadratic-simple",
    isCompleted: false,
  },
  // Batch 2
  {
    id: uuidv4(),
    batchId: DUMMY_BATCH_2_ID,
    equation: "a / 3 = 7",
    answer: "21",
    solutionSteps: [
      "a / 3 * 3 = 7 * 3",
      "a = 21",
    ],
    difficulty: "easy",
    problemType: "linear-one-variable",
    isCompleted: false,
  },
  {
    id: uuidv4(),
    batchId: DUMMY_BATCH_2_ID,
    equation: "b + 9 = 3",
    answer: "-6",
    solutionSteps: [
      "b + 9 - 9 = 3 - 9",
      "b = -6",
    ],
    difficulty: "easy",
    problemType: "linear-one-variable",
    isCompleted: false,
  },
];

// This is how you might structure the input for a service function
export const dummyBatchAndProblemsInput = [
    {
        batch: dummyProblemBatchesInput[0],
        problems: dummyProblemsInput.filter(p => p.batchId === dummyProblemBatchesInput[0].id)
    },
    {
        batch: dummyProblemBatchesInput[1],
        problems: dummyProblemsInput.filter(p => p.batchId === dummyProblemBatchesInput[1].id)
    }
];
