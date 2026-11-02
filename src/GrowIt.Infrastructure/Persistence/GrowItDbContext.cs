using GrowIt.Application.Common.Exceptions;
using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using GrowIt.Infrastructure.Persistence.Seed;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GrowIt.Infrastructure.Persistence;

public class GrowItDbContext(DbContextOptions<GrowItDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<Set> Sets => Set<Set>();
    public DbSet<TrainingPlan> TrainingPlans => Set<TrainingPlan>();
    public DbSet<TrainingPlanDay> TrainingPlanDays => Set<TrainingPlanDay>();
    public DbSet<TrainingPlanDayExercise> TrainingPlanDayExercises => Set<TrainingPlanDayExercise>();

    /// Turns a duplicate-key violation into something the caller can act on.
    ///
    /// Handlers check whether a client-supplied id is already taken before inserting,
    /// but two concurrent retries can both pass that check and race to the insert.
    /// Whoever loses would otherwise surface as a 500 - which an offline client reads
    /// as "try again", forever. A conflict says the row is there now: stop and refetch.
    /// Postgres is this layer's business, so the translation belongs here rather than
    /// leaking a driver dependency up into Application.
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new ConflictException("A row with this id already exists.", exception);
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation })
        {
            // Something the write points at is not there - a library exercise that has
            // since been removed, a parent whose own write never landed. A 500 would read
            // to the offline queue as retryable and loop forever; this can never succeed,
            // so it is a 404.
            throw new NotFoundException("A row this write refers to does not exist.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var seededAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Exercise>().HasData(ExerciseSeed.All(seededAt));
    }
}
