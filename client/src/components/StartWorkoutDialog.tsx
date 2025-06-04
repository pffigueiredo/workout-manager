
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Plus, Check } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { WorkoutRoutineWithExercises, CreateWorkoutSessionInput, CreateWorkoutSetInput } from '../../../server/src/schema';

interface StartWorkoutDialogProps {
  routine: WorkoutRoutineWithExercises;
  userId: number;
  onWorkoutCompleted: () => void;
}

interface WorkoutSet {
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number;
}

export function StartWorkoutDialog({ routine, userId, onWorkoutCompleted }: StartWorkoutDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workoutName, setWorkoutName] = useState(`${routine.name} - ${new Date().toLocaleDateString()}`);
  const [currentSets, setCurrentSets] = useState<WorkoutSet[]>([]);
  const [currentExercise, setCurrentExercise] = useState<string>('');
  const [setData, setSetData] = useState({
    reps: '',
    weight: ''
  });

  const handleStartWorkout = () => {
    setCurrentSets([]);
    setCurrentExercise(routine.exercises[0]?.name || '');
  };

  const addSet = () => {
    if (!currentExercise || !setData.reps || !setData.weight) return;

    const newSet: WorkoutSet = {
      exercise_name: currentExercise,
      set_number: currentSets.filter(s => s.exercise_name === currentExercise).length + 1,
      reps: parseInt(setData.reps),
      weight: parseFloat(setData.weight)
    };

    setCurrentSets((prev: WorkoutSet[]) => [...prev, newSet]);
    setSetData({ reps: '', weight: '' });
  };

  const finishWorkout = async () => {
    if (currentSets.length === 0) return;

    setIsLoading(true);
    try {
      // Create workout session
      const sessionData: CreateWorkoutSessionInput = {
        user_id: userId,
        routine_id: routine.id,
        name: workoutName
      };
      
      const session = await trpc.createWorkoutSession.mutate(sessionData);

      // Create all workout sets
      const setPromises = currentSets.map((set: WorkoutSet) => {
        const setData: CreateWorkoutSetInput = {
          session_id: session.id,
          exercise_name: set.exercise_name,
          set_number: set.set_number,
          reps: set.reps,
          weight: set.weight
        };
        return trpc.createWorkoutSet.mutate(setData);
      });

      await Promise.all(setPromises);
      
      onWorkoutCompleted();
      setIsOpen(false);
      setCurrentSets([]);
      setWorkoutName(`${routine.name} - ${new Date().toLocaleDateString()}`);
    } catch (error) {
      console.error('Failed to save workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exerciseStats = routine.exercises.map(exercise => ({
    name: exercise.name,
    sets: currentSets.filter(s => s.exercise_name === exercise.name)
  }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleStartWorkout}>
          <Play className="h-4 w-4 mr-2" />
          Start Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>🔥 {routine.name}</span>
          </DialogTitle>
          <DialogDescription>
            Log your sets and reps for each exercise
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workout-name">Workout Name</Label>
            <Input
              id="workout-name"
              value={workoutName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkoutName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exercise Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Set</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Exercise</Label>
                  <select
                    value={currentExercise}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrentExercise(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select exercise</option>
                    {routine.exercises.map(exercise => (
                      <option key={exercise.id} value={exercise.name}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reps">Reps</Label>
                    <Input
                      id="reps"
                      type="number"
                      placeholder="12"
                      value={setData.reps}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSetData(prev => ({ ...prev, reps: e.target.value }))
                      }
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="135"
                      value={setData.weight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSetData(prev => ({ ...prev, weight: e.target.value }))
                      }
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>

                <Button 
                  onClick={addSet} 
                  disabled={!currentExercise || !setData.reps || !setData.weight}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Set
                </Button>
              </CardContent>
            </Card>

            {/* Workout Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Workout Progress</span>
                  <Badge variant="secondary">{currentSets.length} sets logged</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exerciseStats.map((exercise, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{exercise.name}</span>
                        <Badge variant={exercise.sets.length > 0 ? "default" : "secondary"}>
                          {exercise.sets.length} sets
                        </Badge>
                      </div>
                      {exercise.sets.length > 0 && (
                        <div className="space-y-1 text-sm text-gray-600 ml-4">
                          {exercise.sets.map((set: WorkoutSet, setIndex: number) => (
                            <div key={setIndex} className="flex justify-between">
                              <span>Set {set.set_number}:</span>
                              <span className="font-medium">{set.reps} reps @ {set.weight}lbs</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {index < exerciseStats.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={finishWorkout}
            disabled={isLoading || currentSets.length === 0}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              'Saving...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Finish Workout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
