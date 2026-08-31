using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.ReorderPlanDays;

public class ReorderPlanDaysCommandValidator : AbstractValidator<ReorderPlanDaysCommand>
{
    public ReorderPlanDaysCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.DayIds).NotEmpty();
    }
}
