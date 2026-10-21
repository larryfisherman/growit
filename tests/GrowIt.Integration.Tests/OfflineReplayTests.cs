using System.Net;
using System.Net.Http.Json;
using GrowIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Integration.Tests;

/// What the server owes a phone that has been offline.
///
/// Writes reach us late, twice, at the same time as their own retry, and after the
/// world they were made in has moved on. Every one of them was something the user did,
/// so the rule is the same throughout: if it can be kept, keep it, and never answer
/// "done" for something that was not done.
public class OfflineReplayTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private static readonly Guid BenchPress = Guid.Parse("a1b2c3d4-0001-0000-0000-000000000000");

    private readonly Guid _userId = Guid.CreateVersion7();

    private static GrowItDbContext NewContext() => TestDatabase.NewContext();

    public Task InitializeAsync() => TestDatabase.EnsureMigratedAsync();

    public async Task DisposeAsync()
    {
        await using var db = NewContext();

        // Sessions first, in a save of their own: a plan's days go with it by cascade in
        // the database, where a session still pointing at one of them would stop it.
        db.Workouts.RemoveRange(await db.Workouts.Where(w => w.UserId == _userId).ToListAsync());
        await db.SaveChangesAsync();

        db.TrainingPlans.RemoveRange(await db.TrainingPlans.Where(p => p.UserId == _userId).ToListAsync());
        await db.SaveChangesAsync();
    }

    private HttpClient Mine() => factory.ClientFor(_userId);

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    /// A plan with one day holding bench press, built over HTTP the way the app builds it.
    private async Task<(Guid PlanId, Guid DayId, Guid RowId)> PlanWithBenchDayAsync()
    {
        var planId = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();
        var rowId = Guid.CreateVersion7();

        (await Mine().PostAsJsonAsync("/api/training-plans", new { id = planId, name = "Plan", notes = (string?)null }))
            .EnsureSuccessStatusCode();
        (await Mine().PostAsJsonAsync($"/api/training-plans/{planId}/days", new { id = dayId, name = "Push", notes = (string?)null }))
            .EnsureSuccessStatusCode();
        (await Mine().PutAsJsonAsync($"/api/training-plans/days/{dayId}/exercises", new
        {
            exercises = new[] { new { planDayExerciseId = (Guid?)rowId, exerciseId = (Guid?)BenchPress, customExerciseName = (string?)null } },
        })).EnsureSuccessStatusCode();

        return (planId, dayId, rowId);
    }

    [Fact]
    public async Task Concurrent_replays_of_one_create_all_succeed()
    {
        // A retry fired while the original is still being processed - a timeout on a slow
        // link does exactly this. Both are the same write; neither may come back as a
        // failure, or the client reports as lost a plan that was saved.
        var id = Guid.CreateVersion7();
        var body = new { id, name = "Plan", notes = (string?)null };

        var responses = await Task.WhenAll(
            Enumerable.Range(0, 8).Select(_ => Mine().PostAsJsonAsync("/api/training-plans", body)));

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));

        await using var db = NewContext();
        Assert.Equal(1, await db.TrainingPlans.CountAsync(p => p.Id == id));
    }

    [Fact]
    public async Task A_session_started_from_a_day_deleted_elsewhere_is_kept_with_its_sets()
    {
        // Started in a basement gym from a day that, meanwhile, was deleted on the
        // user's other phone. The session happened; the sets were lifted.
        var (_, dayId, _) = await PlanWithBenchDayAsync();
        (await Mine().DeleteAsync($"/api/training-plans/days/{dayId}")).EnsureSuccessStatusCode();

        var workoutId = Guid.CreateVersion7();
        var workoutExerciseId = Guid.CreateVersion7();

        var started = await Mine().PostAsJsonAsync("/api/Workouts/from-plan-day", new
        {
            id = workoutId,
            planDayId = dayId,
            performedAt = Today,
            name = "Push",
            exerciseIds = (object?)null,
            // What the phone copied from the day when the session was started.
            exercises = new[]
            {
                new
                {
                    workoutExerciseId, exerciseId = (Guid?)BenchPress, customExerciseName = (string?)null,
                    targetSets = (int?)5, targetReps = (int?)5, restSeconds = (int?)180, orderIndex = 0,
                },
            },
        });
        Assert.Equal(HttpStatusCode.OK, started.StatusCode);

        var set = await Mine().PostAsJsonAsync($"/api/Exercises/{workoutExerciseId}/sets", new
        {
            id = Guid.CreateVersion7(), weightKg = 100m, reps = 5, orderIndex = 0,
        });
        Assert.Equal(HttpStatusCode.OK, set.StatusCode);

        await using var db = NewContext();
        var stored = await db.WorkoutExercises.SingleAsync(e => e.Id == workoutExerciseId);
        Assert.Equal(workoutId, stored.WorkoutId);
        Assert.Equal(5, stored.TargetSets);
        Assert.True(await db.Sets.AnyAsync(s => s.WorkoutExerciseId == workoutExerciseId));
    }

    [Fact]
    public async Task Sets_logged_offline_land_even_when_the_phone_knew_the_day_by_other_row_ids()
    {
        // The phone's copy of the day carries a row id the server never kept (it was
        // created offline and replaced on the way). The session's ids are the phone's
        // own, and sets logged into them must not be dropped.
        var (_, dayId, _) = await PlanWithBenchDayAsync();

        var workoutId = Guid.CreateVersion7();
        var workoutExerciseId = Guid.CreateVersion7();
        var rowTheServerNeverHad = Guid.CreateVersion7();

        var started = await Mine().PostAsJsonAsync("/api/Workouts/from-plan-day", new
        {
            id = workoutId,
            planDayId = dayId,
            performedAt = Today,
            name = "Push",
            exerciseIds = new[] { new { planDayExerciseId = rowTheServerNeverHad, workoutExerciseId } },
            exercises = new[]
            {
                new
                {
                    workoutExerciseId, exerciseId = (Guid?)BenchPress, customExerciseName = (string?)null,
                    targetSets = (int?)3, targetReps = (int?)10, restSeconds = (int?)90, orderIndex = 0,
                },
            },
        });
        Assert.Equal(HttpStatusCode.OK, started.StatusCode);

        var set = await Mine().PostAsJsonAsync($"/api/Exercises/{workoutExerciseId}/sets", new
        {
            id = Guid.CreateVersion7(), weightKg = 60m, reps = 10, orderIndex = 0,
        });
        Assert.Equal(HttpStatusCode.OK, set.StatusCode);
    }
}
