using FluentValidation;
namespace GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;

public class AddExerciseToWorkoutCommandValidator : AbstractValidator<AddExerciseToWorkoutCommand>
{
    public AddExerciseToWorkoutCommandValidator()
    {
        RuleFor(x => x.WorkoutId).NotEmpty();
        RuleFor(x => x.ExerciseId).NotEmpty();
    }
}