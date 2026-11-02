using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.Workouts.Commands.LogSet;

public class LogSetCommandValidator : AbstractValidator<LogSetCommand>
{
    public LogSetCommandValidator()
    {
        RuleFor(x => x.Id).ClientSuppliedId();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.WorkoutExerciseId).NotEmpty();

        // A set that was not lifted is not a set; negatives are nonsense either way.
        RuleFor(x => x.Reps).GreaterThan(0);
        RuleFor(x => x.WeightKg).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OrderIndex).GreaterThanOrEqualTo(0);
    }
}
