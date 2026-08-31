using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.CreatePlanDay;

public class CreatePlanDayCommandValidator : AbstractValidator<CreatePlanDayCommand>
{
    public CreatePlanDayCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
