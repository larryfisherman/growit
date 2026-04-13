using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Infrastructure.Persistence;

public class GrowItDbContext(DbContextOptions<GrowItDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<Set> Sets => Set<Set>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GrowItDbContext).Assembly);
    }
}
