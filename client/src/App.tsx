
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Dumbbell, Calendar, Trophy, LogOut } from 'lucide-react';
import type { User, WorkoutRoutineWithExercises, WorkoutSessionWithSets } from '../../server/src/schema';
import { AuthForm } from '@/components/AuthForm';
import { CreateRoutineForm } from '@/components/CreateRoutineForm';
import { StartWorkoutDialog } from '@/components/StartWorkoutDialog';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [routines, setRoutines] = useState<WorkoutRoutineWithExercises[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionWithSets[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('routines');

  const loadUserData = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      const [routinesData, historyData] = await Promise.all([
        trpc.getUserWorkoutRoutines.query({ userId }),
        trpc.getUserWorkoutHistory.query({ userId })
      ]);
      setRoutines(routinesData);
      setWorkoutHistory(historyData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = () => {
    setUser(null);
    setRoutines([]);
    setWorkoutHistory([]);
    setActiveTab('routines');
  };

  const handleRoutineCreated = (newRoutine: WorkoutRoutineWithExercises) => {
    setRoutines(prev => [...prev, newRoutine]);
  };

  const handleWorkoutCompleted = async () => {
    if (user) {
      await loadUserData(user.id);
      setActiveTab('history');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-600 p-3 rounded-full">
                <Dumbbell className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💪 FitTracker</h1>
            <p className="text-gray-600">Your personal workout companion</p>
          </div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">💪 FitTracker</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}!</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="routines" className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span>My Routines</span>
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Start Workout</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routines" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">💪 My Workout Routines</h2>
                <p className="text-gray-600">Create and manage your custom workout routines</p>
              </div>
            </div>

            <CreateRoutineForm 
              userId={user.id} 
              onRoutineCreated={handleRoutineCreated}
            />

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : routines.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No routines yet</h3>
                  <p className="text-gray-600 mb-4">Create your first workout routine to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {routines.map((routine: WorkoutRoutineWithExercises) => (
                  <Card key={routine.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{routine.name}</span>
                        <Badge variant="secondary">{routine.exercises.length} exercises</Badge>
                      </CardTitle>
                      {routine.description && (
                        <CardDescription>{routine.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-900">Exercises:</h4>
                        <div className="space-y-1">
                          {routine.exercises.map((exercise, index) => (
                            <div key={exercise.id} className="flex items-center space-x-2 text-sm text-gray-600">
                              <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                                {index + 1}
                              </span>
                              <span>{exercise.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <p className="text-xs text-gray-500">
                        Created {routine.created_at.toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workout" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🔥 Start a Workout</h2>
              <p className="text-gray-600">Choose a routine and log your workout session</p>
            </div>

            {routines.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No routines available</h3>
                  <p className="text-gray-600 mb-4">Create a workout routine first to start logging workouts!</p>
                  <Button onClick={() => setActiveTab('routines')} className="bg-indigo-600 hover:bg-indigo-700">
                    Create Routine
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {routines.map((routine: WorkoutRoutineWithExercises) => (
                  <Card key={routine.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle>{routine.name}</CardTitle>
                      {routine.description && (
                        <CardDescription>{routine.description}</CardDescription>
                      )}
                      <Badge variant="outline" className="w-fit">
                        {routine.exercises.length} exercises
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <StartWorkoutDialog 
                        routine={routine}
                        userId={user.id}
                        onWorkoutCompleted={handleWorkoutCompleted}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">📊 Workout History</h2>
              <p className="text-gray-600">Track your progress and past workouts</p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : workoutHistory.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No workouts logged yet</h3>
                  <p className="text-gray-600 mb-4">Start your first workout to see your progress here!</p>
                  <Button onClick={() => setActiveTab('workout')} className="bg-indigo-600 hover:bg-indigo-700">
                    Start Workout
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {workoutHistory.map((session: WorkoutSessionWithSets) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span>{session.name}</span>
                          </CardTitle>
                          <CardDescription>
                            Completed on {session.completed_at.toLocaleDateString()} at {session.completed_at.toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {session.sets.length} sets
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Group sets by exercise */}
                        {Object.entries(
                          session.sets.reduce((acc: Record<string, typeof session.sets>, set) => {
                            if (!acc[set.exercise_name]) acc[set.exercise_name] = [];
                            acc[set.exercise_name].push(set);
                            return acc;
                          }, {})
                        ).map(([exerciseName, sets]) => (
                          <div key={exerciseName} className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">{exerciseName}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {sets.map((set) => (
                                <div key={set.id} className="bg-white rounded px-3 py-2 text-sm">
                                  <span className="font-medium">Set {set.set_number}:</span>{' '}
                                  <span className="text-indigo-600 font-semibold">
                                    {set.reps} reps @ {set.weight}lbs
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
