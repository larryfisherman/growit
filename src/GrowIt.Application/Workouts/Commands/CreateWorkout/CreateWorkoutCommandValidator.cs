using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.Workouts.Commands.CreateWorkout;

public class CreateWorkoutCommandValidator : AbstractValidator<CreateWorkoutCommand>
{
    public CreateWorkoutCommandValidator()
    {
        RuleFor(x => x.Id).ClientSuppliedId();

        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).EntityName();
        RuleFor(x => x.PerformedAt).NotEmpty();
    }
}
