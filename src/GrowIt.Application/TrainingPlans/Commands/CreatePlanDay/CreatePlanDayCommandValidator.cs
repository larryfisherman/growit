using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.TrainingPlans.Commands.CreatePlanDay;

public class CreatePlanDayCommandValidator : AbstractValidator<CreatePlanDayCommand>
{
    public CreatePlanDayCommandValidator()
    {
        RuleFor(x => x.Id).ClientSuppliedId();

        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.Name).EntityName();
        RuleFor(x => x.Notes).EntityNotes();
    }
}
