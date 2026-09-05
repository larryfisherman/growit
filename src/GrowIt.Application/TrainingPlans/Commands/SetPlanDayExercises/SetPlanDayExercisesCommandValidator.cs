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
            .Must(HasUsableIdentity)
            .WithMessage("Each entry must name a row, a library exercise, or a custom name - and never both an exercise and a custom name");

        RuleFor(x => x.Selections)
            .Must(NoRepeatedRows)
            .WithMessage("The same existing exercise cannot be listed twice");
    }

    /// A row id may travel together with what the row is, which is how a day edited
    /// offline arrives: the client minted the id itself and still has to say which
    /// exercise it stands for. What stays forbidden is claiming to be a library
    /// exercise and a hand-typed name at once, and naming nothing at all.
    private static bool HasUsableIdentity(PlanDayExerciseSelectionInput selection)
    {
        var namesLibraryExercise = selection.ExerciseId.HasValue;
        var namesCustomExercise = !string.IsNullOrWhiteSpace(selection.CustomExerciseName);

        if (namesLibraryExercise && namesCustomExercise) return false;

        return selection.PlanDayExerciseId.HasValue || namesLibraryExercise || namesCustomExercise;
    }

    private static bool NoRepeatedRows(IReadOnlyList<PlanDayExerciseSelectionInput> selections)
    {
        var rowIds = selections.Where(s => s.PlanDayExerciseId.HasValue)
            .Select(s => s.PlanDayExerciseId!.Value)
            .ToList();
        return rowIds.Count == rowIds.Distinct().Count();
    }
}
