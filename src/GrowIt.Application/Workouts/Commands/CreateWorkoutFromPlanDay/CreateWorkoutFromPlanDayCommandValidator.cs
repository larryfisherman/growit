using FluentValidation;
using GrowIt.Contracts.Workouts.Requests;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public class CreateWorkoutFromPlanDayCommandValidator : AbstractValidator<CreateWorkoutFromPlanDayCommand>
{
    public CreateWorkoutFromPlanDayCommandValidator()
    {
        // The client names the row, so an id is part of the request rather than something
        // we hand back. A record's Guid defaults to empty when the field is simply absent
        // from the body, and empty is an id like any other to the idempotency check: the
        // first caller to use it quietly folds every later write into that one row, and
        // everyone else is refused forever.
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PlanDayId).NotEmpty();
        RuleFor(x => x.PerformedAt).NotEmpty();

        // Each copied row is named once, on both sides. Without this a repeated key blew
        // up inside the handler as a 500 - a permanent failure dressed as a temporary one,
        // which the offline queue would retry without end.
        RuleForEach(x => x.ExerciseIds).ChildRules(assignment =>
        {
            assignment.RuleFor(a => a.PlanDayExerciseId).NotEmpty();
            assignment.RuleFor(a => a.WorkoutExerciseId).NotEmpty();
        });

        RuleFor(x => x.ExerciseIds)
            .Must(NamesEachRowOnce)
            .WithMessage("Each plan day exercise may be mapped once, to an id of its own");

        // Same limit as a session created by hand; the phone takes it from the day.
        RuleFor(x => x.Name).MaximumLength(100);

        // The phone's copy of the session. Each row is named once and is either an
        // exercise from the library or one of the user's own - the same rule a row added
        // by hand follows.
        RuleForEach(x => x.Exercises).ChildRules(copied =>
        {
            copied.RuleFor(e => e.WorkoutExerciseId).NotEmpty();
            copied.RuleFor(e => e.OrderIndex).GreaterThanOrEqualTo(0);
            copied.RuleFor(e => e)
                .Must(e => e.ExerciseId.HasValue || !string.IsNullOrWhiteSpace(e.CustomExerciseName))
                .WithMessage("Each exercise must come from the library or have a name");
            copied.RuleFor(e => e.CustomExerciseName).MaximumLength(100);
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
