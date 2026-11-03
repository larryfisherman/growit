using FluentValidation;
using GrowIt.Application.Common.Validation;
using GrowIt.Contracts.TrainingPlans.Requests;

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

        // The length limit applies to rows being created. An entry that names a row by id
        // may be one the day already holds, and the phone re-sends its stored name with it;
        // names saved before the limit existed can be longer, and the handler never reads
        // the name of a row it finds by id. A client-minted id that creates a row is checked
        // in the handler, where it is known that a row is being created.
        RuleForEach(x => x.Selections).ChildRules(selection =>
            selection.RuleFor(s => s.CustomExerciseName).CustomExerciseName()
                .When(s => s.PlanDayExerciseId is null));

        RuleFor(x => x.Selections)
            .Must(NoRepeatedRows)
            .WithMessage("The same existing exercise cannot be listed twice");
    }

    /// A row id may travel together with what the row is, which is how a day edited
    /// offline arrives: the client minted the id itself and still has to say which
    /// exercise it stands for. What stays forbidden is claiming to be a library
    /// exercise and a hand-typed name at once, and naming nothing at all.
    private static bool HasUsableIdentity(PlanDayExerciseSelection selection)
    {
        var namesLibraryExercise = ExerciseIdentity.NamesLibraryExercise(selection.ExerciseId);
        var namesCustomExercise = ExerciseIdentity.NamesCustomExercise(selection.CustomExerciseName);

        if (namesLibraryExercise && namesCustomExercise) return false;

        return selection.PlanDayExerciseId.HasValue || namesLibraryExercise || namesCustomExercise;
    }

    private static bool NoRepeatedRows(IReadOnlyList<PlanDayExerciseSelection> selections)
    {
        var rowIds = selections.Where(s => s.PlanDayExerciseId.HasValue)
            .Select(s => s.PlanDayExerciseId!.Value)
            .ToList();
        return rowIds.Count == rowIds.Distinct().Count();
    }
}
