using FluentValidation;

namespace GrowIt.Application.Workouts.Commands.UpdateSet;

public class UpdateSetCommandValidator : AbstractValidator<UpdateSetCommand>
{
    public UpdateSetCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.SetId).NotEmpty();

        // Same limits as logging one: see LogSetCommandValidator.
        RuleFor(x => x.Reps).GreaterThan(0);
        RuleFor(x => x.WeightKg).GreaterThanOrEqualTo(0);
    }
}
