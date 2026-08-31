using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.CreateTrainingPlan;

public class CreateTrainingPlanCommandValidator : AbstractValidator<CreateTrainingPlanCommand>
{
    public CreateTrainingPlanCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
