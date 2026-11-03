using FluentValidation;
using GrowIt.Application.Common.Validation;
using GrowIt.Contracts.Workouts.Requests;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public class CreateWorkoutFromPlanDayCommandValidator : AbstractValidator<CreateWorkoutFromPlanDayCommand>
{
    public CreateWorkoutFromPlanDayCommandValidator()
    {
        RuleFor(x => x.Id).ClientSuppliedId();

        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();
        RuleFor(x => x.PerformedAt).NotEmpty();

        // Each copied row is named once, on both sides. A repeated key would fail inside the
        // handler as a 500, which the offline queue retries forever; reject it here as a 400.
        RuleForEach(x => x.ExerciseIds).ChildRules(assignment =>
        {
            assignment.RuleFor(a => a.PlanDayExerciseId).NotEmpty();
            assignment.RuleFor(a => a.WorkoutExerciseId).NotEmpty();
        });

        RuleFor(x => x.ExerciseIds)
            .Must(NamesEachRowOnce)
            .WithMessage("Each plan day exercise may be mapped once, to an id of its own");

        // Same limit as a session created by hand; the phone takes it from the day.
        RuleFor(x => x.Name).MaximumLength(FieldLimits.NameMaxLength);

        // The phone's copy of the session. Each row is named once and follows the plan-day
        // row rules it was copied from: a library exercise or a custom name (never both),
        // sensible targets where present, and a non-negative position. A custom name is not
        // length-checked here: it is copied from a stored row, and rows saved before the
        // plan-day limit existed can be longer. Refusing the copy would lose the session and
        // every set logged into it, so the handler shortens the name instead.
        RuleForEach(x => x.Exercises).ChildRules(copied =>
        {
            copied.RuleFor(e => e.WorkoutExerciseId).NotEmpty();
            copied.RuleFor(e => e.OrderIndex).Position();
            copied.RuleFor(e => e.TargetSets).TargetCount();
            copied.RuleFor(e => e.TargetReps).TargetCount();
            copied.RuleFor(e => e.RestSeconds).RestSeconds();
            copied.RuleFor(e => e)
                .Must(e => ExerciseIdentity.IsExactlyOne(e.ExerciseId, e.CustomExerciseName))
                .WithMessage(ExerciseIdentity.ExactlyOneMessage);
        });

        RuleFor(x => x.Exercises)
            .Must(exercises => exercises is null
                || exercises.Select(e => e.WorkoutExerciseId).Distinct().Count() == exercises.Count)
            .WithMessage("Each exercise of the session needs an id of its own");
    }

    private static bool NamesEachRowOnce(IReadOnlyList<WorkoutExerciseIdAssignment> assignments)
    {
        var sources = assignments.Select(a => a.PlanDayExerciseId).ToList();
        var targets = assignments.Select(a => a.WorkoutExerciseId).ToList();

        return sources.Count == sources.Distinct().Count()
            && targets.Count == targets.Distinct().Count();
    }
}
