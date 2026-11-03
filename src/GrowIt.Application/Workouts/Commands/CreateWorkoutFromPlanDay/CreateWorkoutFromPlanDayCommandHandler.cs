using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Idempotency;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Application.Common.Ownership;
using GrowIt.Application.Common.Validation;
using GrowIt.Contracts.Workouts.Requests;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public class CreateWorkoutFromPlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreateWorkoutFromPlanDayCommand, Guid>
{
    public async Task<Guid> Handle(CreateWorkoutFromPlanDayCommand request, CancellationToken cancellationToken)
    {
        // Looked up first: whether the day is still there decides what a replay of this
        // write should look like, so the idempotency check needs to know.
        var day = await dbContext.TrainingPlanDays
            .Include(d => d.Exercises)
            .OwnedBy(request.UserId)
            .FirstOrDefaultAsync(d => d.Id == request.PlanDayId, cancellationToken);

        // Without the phone's own copy there is nothing to build the session from.
        if (day is null && request.Exercises is null)
        {
            throw new NotFoundException($"Plan day {request.PlanDayId} not found");
        }

        // The plan day is the parent here, so an id already spent on a plain workout is
        // caught rather than answered as a successful retry. A session whose day has gone
        // hangs off nothing, before and after a replay alike.
        var expectedParentId = day?.Id ?? Guid.Empty;

        var existing = dbContext.Workouts
            .Where(w => w.Id == request.Id)
            .Select(w => new ExistingRow(w.UserId, w.PlanDayId ?? Guid.Empty));

        var create = new IdempotentCreate(dbContext, existing, request.Id, request.UserId, expectedParentId);

        if (await create.AlreadyCreatedAsync(cancellationToken))
        {
            return request.Id;
        }

        // The targets are copied rather than referenced: editing the plan later must
        // not rewrite what a past session says it was meant to be.
        var workout = new Workout
        {
            Id = request.Id,
            UserId = request.UserId,
            Name = request.Name ?? day?.Name ?? "Trening",
            PerformedAt = request.PerformedAt,
            CreatedAt = DateTime.UtcNow,
            PlanDayId = day?.Id,
            WorkoutExercises = request.Exercises is { } copied
                ? FromPhone(copied)
                : FromDay(day!, request.ExerciseIds)
        };

        dbContext.Workouts.Add(workout);
        await create.SaveAsync(cancellationToken);

        return workout.Id;
    }

    /// The session as the phone started it. Its ids are the ones sets logged offline
    /// already point at, so they are taken as they are - even where the day the copy was
    /// made from no longer looks the same here.
    private static List<WorkoutExercise> FromPhone(IReadOnlyList<WorkoutExerciseSnapshot> copied) =>
        copied
            .OrderBy(e => e.OrderIndex)
            .Select(e => new WorkoutExercise
            {
                Id = e.WorkoutExerciseId,
                ExerciseId = e.ExerciseId,
                CustomExerciseName = WithinNameLimit(e.CustomExerciseName),
                TargetSets = e.TargetSets,
                TargetReps = e.TargetReps,
                RestSeconds = e.RestSeconds,
                OrderIndex = e.OrderIndex
            })
            .ToList();

    /// A plan-day row saved before custom names were limited can carry a longer name. The
    /// session is kept and the name shortened, rather than refusing the whole copy.
    private static string? WithinNameLimit(string? name) =>
        name is { Length: > FieldLimits.NameMaxLength } ? name[..FieldLimits.NameMaxLength] : name;

    /// The copy made here, for clients that do not send their own.
    private static List<WorkoutExercise> FromDay(
        TrainingPlanDay day, IReadOnlyList<WorkoutExerciseIdAssignment> assignments)
    {
        // The client names the ids of the copied rows so it can start logging sets into
        // them before this request is answered. Anything it did not name gets one from us.
        var assignedIds = assignments.ToDictionary(
            assignment => assignment.PlanDayExerciseId,
            assignment => assignment.WorkoutExerciseId);

        return day.Exercises
            .OrderBy(e => e.OrderIndex)
            .Select(e => new WorkoutExercise
            {
                Id = assignedIds.TryGetValue(e.Id, out var assigned) ? assigned : Guid.CreateVersion7(),
                ExerciseId = e.ExerciseId,
                CustomExerciseName = e.CustomExerciseName,
                TargetSets = e.TargetSets,
                TargetReps = e.TargetReps,
                RestSeconds = e.RestSeconds,
                OrderIndex = e.OrderIndex
            })
            .ToList();
    }
}
