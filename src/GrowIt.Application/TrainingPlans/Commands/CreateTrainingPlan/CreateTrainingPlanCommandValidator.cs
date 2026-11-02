using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.TrainingPlans.Commands.CreateTrainingPlan;

public class CreateTrainingPlanCommandValidator : AbstractValidator<CreateTrainingPlanCommand>
{
    public CreateTrainingPlanCommandValidator()
    {
        RuleFor(x => x.Id).ClientSuppliedId();

        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Name).EntityName();
        RuleFor(x => x.Notes).EntityNotes();
    }
}
