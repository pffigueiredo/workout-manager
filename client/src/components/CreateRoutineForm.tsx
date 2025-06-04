
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateWorkoutRoutineInput, CreateExerciseInput, WorkoutRoutineWithExercises } from '../../../server/src/schema';

interface CreateRoutineFormProps {
  userId: number;
  onRoutineCreated: (routine: WorkoutRoutineWithExercises) => void;
}

export function CreateRoutineForm({ userId, onRoutineCreated }: CreateRoutineFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [routineData, setRoutineData] = useState<CreateWorkoutRoutineInput>({
    user_id: userId,
    name: '',
    description: null
  });
  const [exercises, setExercises] = useState<string[]>([]);
  const [newExercise, setNewExercise] = useState('');

  const addExercise = () => {
    if (newExercise.trim() && !exercises.includes(newExercise.trim())) {
      setExercises((prev: string[]) => [...prev, newExercise.trim()]);
      setNewExercise('');
    }
  };

  const removeExercise = (exerciseToRemove: string) => {
    setExercises((prev: string[]) => prev.filter(ex => ex !== exerciseToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exercises.length === 0) return;
    
    setIsLoading(true);
    try {
      // Create the routine first
      const routine = await trpc.createWorkoutRoutine.mutate(routineData);
      
      // Create all exercises for this routine
      const exercisePromises = exercises.map((exerciseName: string, index: number) => {
        const exerciseData: CreateExerciseInput = {
          routine_id: routine.id,
          name: exerciseName,
          order_index: index
        };
        return trpc.createExercise.mutate(exerciseData);
      });
      
      const createdExercises = await Promise.all(exercisePromises);
      
      // Create the complete routine object with exercises
      const routineWithExercises: WorkoutRoutineWithExercises = {
        ...routine,
        exercises: createdExercises
      };
      
      onRoutineCreated(routineWithExercises);
      
      // Reset form
      setRoutineData({
        user_id: userId,
        name: '',
        description: null
      });
      setExercises([]);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create routine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="border-dashed border-2 border-gray-300 hover:border-indigo-400 transition-colors duration-200">
        <CardContent className="flex items-center justify-center py-8">
          <Button 
            onClick={() => setIsExpanded(true)} 
            variant="ghost" 
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Routine</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create New Routine</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Build your custom workout routine</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="routine-name">Routine Name</Label>
            <Input
              id="routine-name"
              placeholder="e.g., Push Day, Full Body, Leg Day"
              value={routineData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRoutineData((prev: CreateWorkoutRoutineInput) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="routine-description">Description (optional)</Label>
            <Textarea
              id="routine-description"
              placeholder="Describe your routine..."
              value={routineData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRoutineData((prev: CreateWorkoutRoutineInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Badge variant="secondary">{exercises.length} added</Badge>
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., Bench Press, Squats, Deadlifts"
                value={newExercise}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExercise(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExercise();
                  }
                }}
              />
              <Button type="button" onClick={addExercise} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {exercises.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exercises.map((exercise: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{exercise}</span>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              type="submit" 
              disabled={isLoading || !routineData.name.trim() || exercises.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? 'Creating...' : 'Create Routine'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
