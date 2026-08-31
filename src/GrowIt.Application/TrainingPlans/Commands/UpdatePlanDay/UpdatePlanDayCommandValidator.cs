using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDay;

public class UpdatePlanDayCommandValidator : AbstractValidator<UpdatePlanDayCommand>
{
    public UpdatePlanDayCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
