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

        // The phone's copy of the session. Each row is named once and either comes from the
        // library or carries a hand-typed name. Both may be present, because the copy is
        // accepted exactly as the phone made it (unlike a row added to a plan day, where
        // they are exclusive).
        RuleForEach(x => x.Exercises).ChildRules(copied =>
        {
            copied.RuleFor(e => e.WorkoutExerciseId).NotEmpty();
            copied.RuleFor(e => e.OrderIndex).GreaterThanOrEqualTo(0);
            copied.RuleFor(e => e)
                .Must(e => e.ExerciseId.HasValue || !string.IsNullOrWhiteSpace(e.CustomExerciseName))
                .WithMessage("Each exercise must come from the library or have a name");
            // The plan-day side has no such limit; see the known gap in FieldLimits.
            copied.RuleFor(e => e.CustomExerciseName).MaximumLength(FieldLimits.NameMaxLength);
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
