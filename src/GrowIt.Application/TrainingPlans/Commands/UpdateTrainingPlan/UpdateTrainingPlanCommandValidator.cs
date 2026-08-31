using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.UpdateTrainingPlan;

public class UpdateTrainingPlanCommandValidator : AbstractValidator<UpdateTrainingPlanCommand>
{
    public UpdateTrainingPlanCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
