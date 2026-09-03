using GrowIt.Application.TrainingPlans.Commands.SetPlanDayExercises;
using GrowIt.Domain.Entities;
using GrowIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Integration.Tests;

/// Exercises the declarative "set the day's exercises" command against the local
/// Postgres from docker-compose. Each test builds and tears down its own plan.
public class SetPlanDayExercisesTests : IAsyncLifetime
{
    private const string ConnectionString =
        "Host=localhost;Port=5432;Database=growit;Username=growit;Password=localdev";

    private static readonly Guid BenchPress = Guid.Parse("a1b2c3d4-0001-0000-0000-000000000000");
    private static readonly Guid DumbbellPress = Guid.Parse("a1b2c3d4-0002-0000-0000-000000000000");
    private static readonly Guid Deadlift = Guid.Parse("a1b2c3d4-0004-0000-0000-000000000000");

    private readonly Guid _userId = Guid.NewGuid();
    private Guid _planId;
    private Guid _dayId;
    private Guid _benchRowId;
    private Guid _dumbbellRowId;

    private static GrowItDbContext NewContext() =>
        new(new DbContextOptionsBuilder<GrowItDbContext>().UseNpgsql(ConnectionString).Options);

    public async Task InitializeAsync()
    {
        await using var db = NewContext();

        _planId = Guid.NewGuid();
        _dayId = Guid.NewGuid();
        _benchRowId = Guid.NewGuid();
        _dumbbellRowId = Guid.NewGuid();

        db.TrainingPlans.Add(new TrainingPlan
        {
            Id = _planId,
            UserId = _userId,
            Name = "Test plan",
            CreatedAt = DateTime.UtcNow,
            Days =
            {
                new TrainingPlanDay
                {
                    Id = _dayId,
                    Name = "Push",
                    OrderIndex = 0,
                    CreatedAt = DateTime.UtcNow,
                    Exercises =
                    {
                        // Tuned away from the defaults - this is what must survive.
                        new TrainingPlanDayExercise
                        {
                            Id = _benchRowId, ExerciseId = BenchPress,
                            TargetSets = 5, TargetReps = 5, RestSeconds = 180, OrderIndex = 0
                        },
                        new TrainingPlanDayExercise
                        {
                            Id = _dumbbellRowId, ExerciseId = DumbbellPress,
                            TargetSets = 3, TargetReps = 10, RestSeconds = 90, OrderIndex = 1
                        }
                    }
                }
            }
        });

        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await using var db = NewContext();
        var plan = await db.TrainingPlans.FirstOrDefaultAsync(p => p.Id == _planId);
        if (plan is not null)
        {
            db.TrainingPlans.Remove(plan);
            await db.SaveChangesAsync();
        }
    }

    private async Task<List<TrainingPlanDayExercise>> ReadDayAsync()
    {
        await using var db = NewContext();
        return await db.TrainingPlanDayExercises
            .Where(e => e.PlanDayId == _dayId)
            .OrderBy(e => e.OrderIndex)
            .ToListAsync();
    }

    private async Task RunAsync(params PlanDayExerciseSelectionInput[] selections)
    {
        await using var db = NewContext();
        var handler = new SetPlanDayExercisesCommandHandler(db);
        await handler.Handle(
            new SetPlanDayExercisesCommand(_userId, _dayId, selections), CancellationToken.None);
    }

    [Fact]
    public async Task Applies_the_desired_list_keeping_tuned_targets_and_dropping_the_rest()
    {
        await RunAsync(
            new PlanDayExerciseSelectionInput(_benchRowId, null, null),
            new PlanDayExerciseSelectionInput(null, Deadlift, null),
            new PlanDayExerciseSelectionInput(null, null, "Pompki na poręczach"));

        var rows = await ReadDayAsync();

        Assert.Equal(3, rows.Count);

        // Kept row keeps its id and the targets the user tuned.
        Assert.Equal(_benchRowId, rows[0].Id);
        Assert.Equal(5, rows[0].TargetSets);
        Assert.Equal(180, rows[0].RestSeconds);

        // New library pick starts on the defaults.
        Assert.Equal(Deadlift, rows[1].ExerciseId);
        Assert.Equal(3, rows[1].TargetSets);
        Assert.Equal(10, rows[1].TargetReps);
        Assert.Equal(90, rows[1].RestSeconds);

        Assert.Null(rows[2].ExerciseId);
        Assert.Equal("Pompki na poręczach", rows[2].CustomExerciseName);

        // The one left out of the list is gone.
        Assert.DoesNotContain(rows, r => r.Id == _dumbbellRowId);
    }

    [Fact]
    public async Task Sending_the_same_list_twice_changes_nothing()
    {
        var selections = new[]
        {
            new PlanDayExerciseSelectionInput(_benchRowId, null, null),
            new PlanDayExerciseSelectionInput(null, Deadlift, null),
            new PlanDayExerciseSelectionInput(null, null, "Pompki na poręczach")
        };

        await RunAsync(selections);
        var first = await ReadDayAsync();

        // A retry after a dropped response must not duplicate or churn row ids.
        await RunAsync(selections);
        var second = await ReadDayAsync();

        Assert.Equal(first.Select(r => r.Id), second.Select(r => r.Id));
        Assert.Equal(first.Select(r => r.OrderIndex), second.Select(r => r.OrderIndex));
    }

    [Fact]
    public async Task Position_in_the_list_becomes_the_order()
    {
        await RunAsync(
            new PlanDayExerciseSelectionInput(_dumbbellRowId, null, null),
            new PlanDayExerciseSelectionInput(_benchRowId, null, null));

        var rows = await ReadDayAsync();

        Assert.Equal(new[] { _dumbbellRowId, _benchRowId }, rows.Select(r => r.Id));
        Assert.Equal(new[] { 0, 1 }, rows.Select(r => r.OrderIndex));
    }

    [Fact]
    public async Task An_empty_list_clears_the_day()
    {
        await RunAsync();
        Assert.Empty(await ReadDayAsync());
    }

    [Fact]
    public async Task Rejects_a_row_from_another_day()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            RunAsync(new PlanDayExerciseSelectionInput(Guid.NewGuid(), null, null)));
    }
}
