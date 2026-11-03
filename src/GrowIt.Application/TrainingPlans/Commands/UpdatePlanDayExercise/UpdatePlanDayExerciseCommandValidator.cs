using FluentValidation;
using GrowIt.Application.Common.Validation;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDayExercise;

public class UpdatePlanDayExerciseCommandValidator : AbstractValidator<UpdatePlanDayExerciseCommand>
{
    public UpdatePlanDayExerciseCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayExerciseId).NotEmpty();
        RuleFor(x => x.TargetSets).TargetCount();
        RuleFor(x => x.TargetReps).TargetCount();
        RuleFor(x => x.RestSeconds).RestSeconds();
        RuleFor(x => x.OrderIndex).Position();
    }
}
