using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.TrainingPlans.Commands.UpdateTrainingPlan;

public class UpdateTrainingPlanCommandValidator : AbstractValidator<UpdateTrainingPlanCommand>
{
    public UpdateTrainingPlanCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanId).NotEmpty();
        RuleFor(x => x.Name).EntityName();
        RuleFor(x => x.Notes).EntityNotes();
    }
}
