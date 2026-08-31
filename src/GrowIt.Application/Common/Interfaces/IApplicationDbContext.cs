using GrowIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Exercise> Exercises { get; }
    DbSet<Workout> Workouts { get; }
    DbSet<WorkoutExercise> WorkoutExercises { get; }
    DbSet<Set> Sets { get; }
    DbSet<TrainingPlan> TrainingPlans { get; }
    DbSet<TrainingPlanDay> TrainingPlanDays { get; }
    DbSet<TrainingPlanDayExercise> TrainingPlanDayExercises { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
