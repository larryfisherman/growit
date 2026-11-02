using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDay;

public class UpdatePlanDayCommandValidator : AbstractValidator<UpdatePlanDayCommand>
{
    public UpdatePlanDayCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();
        RuleFor(x => x.Name).EntityName();
        RuleFor(x => x.Notes).EntityNotes();
    }
}
