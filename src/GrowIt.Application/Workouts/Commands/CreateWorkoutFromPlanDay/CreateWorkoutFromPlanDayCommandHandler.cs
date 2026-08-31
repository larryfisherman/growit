using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromPlanDay;

public class CreateWorkoutFromPlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreateWorkoutFromPlanDayCommand, Guid>
{
    public async Task<Guid> Handle(CreateWorkoutFromPlanDayCommand request, CancellationToken cancellationToken)
    {
        var day = await dbContext.TrainingPlanDays
            .Include(d => d.Exercises)
            .FirstOrDefaultAsync(
                d => d.Id == request.PlanDayId && d.Plan.UserId == request.UserId,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Plan day {request.PlanDayId} not found");

        // The targets are copied rather than referenced: editing the plan later must
        // not rewrite what a past session says it was meant to be.
        var workout = new Workout
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = day.Name,
            PerformedAt = request.PerformedAt,
            CreatedAt = DateTime.UtcNow,
            PlanDayId = day.Id,
            WorkoutExercises = day.Exercises
                .OrderBy(e => e.OrderIndex)
                .Select(e => new WorkoutExercise
                {
                    Id = Guid.NewGuid(),
                    ExerciseId = e.ExerciseId,
                    CustomExerciseName = e.CustomExerciseName,
                    TargetSets = e.TargetSets,
                    TargetReps = e.TargetReps,
                    RestSeconds = e.RestSeconds,
                    OrderIndex = e.OrderIndex
                })
                .ToList()
        };

        dbContext.Workouts.Add(workout);
        await dbContext.SaveChangesAsync(cancellationToken);

        return workout.Id;
    }
}
