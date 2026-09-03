using FluentValidation;

namespace GrowIt.Application.TrainingPlans.Commands.SetPlanDayExercises;

public class SetPlanDayExercisesCommandValidator : AbstractValidator<SetPlanDayExercisesCommand>
{
    public SetPlanDayExercisesCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();

        // An empty list is legitimate - it means the user cleared the day.
        RuleFor(x => x.Selections).NotNull();

        RuleForEach(x => x.Selections)
            .Must(HasExactlyOneIdentity)
            .WithMessage("Each entry must be either an existing row, a library exercise, or a custom name");

        RuleFor(x => x.Selections)
            .Must(NoRepeatedRows)
            .WithMessage("The same existing exercise cannot be listed twice");
    }

    private static bool HasExactlyOneIdentity(PlanDayExerciseSelectionInput selection)
    {
        var identities = 0;
        if (selection.PlanDayExerciseId.HasValue) identities++;
        if (selection.ExerciseId.HasValue) identities++;
        if (!string.IsNullOrWhiteSpace(selection.CustomExerciseName)) identities++;
        return identities == 1;
    }

    private static bool NoRepeatedRows(IReadOnlyList<PlanDayExerciseSelectionInput> selections)
    {
        var rowIds = selections.Where(s => s.PlanDayExerciseId.HasValue)
            .Select(s => s.PlanDayExerciseId!.Value)
            .ToList();
        return rowIds.Count == rowIds.Distinct().Count();
    }
}
