using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.UpdatePlanDayExercise;

public class UpdatePlanDayExerciseCommandValidator : AbstractValidator<UpdatePlanDayExerciseCommand>
{
    public UpdatePlanDayExerciseCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayExerciseId).NotEmpty();
        RuleFor(x => x.TargetSets).GreaterThan(0);
        RuleFor(x => x.TargetReps).GreaterThan(0);
        RuleFor(x => x.RestSeconds).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OrderIndex).GreaterThanOrEqualTo(0);
    }
}
