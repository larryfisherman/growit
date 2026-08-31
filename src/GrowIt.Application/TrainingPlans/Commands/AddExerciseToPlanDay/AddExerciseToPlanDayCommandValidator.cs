using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.AddExerciseToPlanDay;

public class AddExerciseToPlanDayCommandValidator : AbstractValidator<AddExerciseToPlanDayCommand>
{
    public AddExerciseToPlanDayCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();
        RuleFor(x => x.TargetSets).GreaterThan(0);
        RuleFor(x => x.TargetReps).GreaterThan(0);
        RuleFor(x => x.RestSeconds).GreaterThanOrEqualTo(0);

        // An exercise is either picked from the library or typed in by hand.
        RuleFor(x => x)
            .Must(x => x.ExerciseId.HasValue ^ !string.IsNullOrWhiteSpace(x.CustomExerciseName))
            .WithMessage("Provide either ExerciseId or CustomExerciseName, not both");
    }
}
