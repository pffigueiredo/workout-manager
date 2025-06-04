
import { type WorkoutSessionWithSets } from '../schema';

export declare function getUserWorkoutHistory(userId: number): Promise<WorkoutSessionWithSets[]>;
