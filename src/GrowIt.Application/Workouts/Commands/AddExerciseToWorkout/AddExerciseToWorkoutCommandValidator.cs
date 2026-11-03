using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;

public class AddExerciseToWorkoutCommandValidator : AbstractValidator<AddExerciseToWorkoutCommand>
{
    public AddExerciseToWorkoutCommandValidator()
    {
        RuleFor(x => x.Id).ClientSuppliedId();

        RuleFor(x => x.WorkoutId).NotEmpty();

        // A row added to a session always comes from the library (the request has no
        // custom name), so its identity is just a non-empty ExerciseId.
        RuleFor(x => x.ExerciseId).NotEmpty();

        // Same rules as a plan-day row; the targets stay optional here.
        RuleFor(x => x.OrderIndex).Position();
        RuleFor(x => x.TargetSets).TargetCount();
        RuleFor(x => x.TargetReps).TargetCount();
        RuleFor(x => x.RestSeconds).RestSeconds();
    }
}
