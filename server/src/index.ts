
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createUserInputSchema, 
  loginInputSchema,
  createWorkoutRoutineInputSchema,
  createExerciseInputSchema,
  createWorkoutSessionInputSchema,
  createWorkoutSetInputSchema
} from './schema';

import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createWorkoutRoutine } from './handlers/create_workout_routine';
import { getUserWorkoutRoutines } from './handlers/get_user_workout_routines';
import { createExercise } from './handlers/create_exercise';
import { createWorkoutSession } from './handlers/create_workout_session';
import { createWorkoutSet } from './handlers/create_workout_set';
import { getUserWorkoutHistory } from './handlers/get_user_workout_history';
import { getWorkoutSessionDetails } from './handlers/get_workout_session_details';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Workout routines
  createWorkoutRoutine: publicProcedure
    .input(createWorkoutRoutineInputSchema)
    .mutation(({ input }) => createWorkoutRoutine(input)),

  getUserWorkoutRoutines: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserWorkoutRoutines(input.userId)),

  // Exercises
  createExercise: publicProcedure
    .input(createExerciseInputSchema)
    .mutation(({ input }) => createExercise(input)),

  // Workout sessions
  createWorkoutSession: publicProcedure
    .input(createWorkoutSessionInputSchema)
    .mutation(({ input }) => createWorkoutSession(input)),

  getWorkoutSessionDetails: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getWorkoutSessionDetails(input.sessionId)),

  // Workout sets
  createWorkoutSet: publicProcedure
    .input(createWorkoutSetInputSchema)
    .mutation(({ input }) => createWorkoutSet(input)),

  // Workout history
  getUserWorkoutHistory: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserWorkoutHistory(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
