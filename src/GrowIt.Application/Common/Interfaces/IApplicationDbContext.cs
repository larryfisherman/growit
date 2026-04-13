using GrowIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Exercise> Exercises { get; }
    DbSet<Workout> Workouts { get; }
    DbSet<WorkoutExercise> WorkoutExercises { get; }
    DbSet<Set> Sets { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
