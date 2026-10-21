using System.Net;
using System.Net.Http.Json;
using GrowIt.Contracts.TrainingPlans.Responses;
using GrowIt.Contracts.Workouts.Responses;
using GrowIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Integration.Tests;

/// Fixing what was typed wrong at the gym, and the "last time" shown while logging.
///
/// Every correction may arrive from a queue that was filled offline - late, twice, or after
/// its target is already gone - so each one is checked for its replay as well as for itself.
public class WorkoutCorrectionTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private static readonly Guid BenchPress = Guid.Parse("a1b2c3d4-0001-0000-0000-000000000000");

    private readonly Guid _userId = Guid.CreateVersion7();
    private readonly Guid _otherUserId = Guid.CreateVersion7();

    private static GrowItDbContext NewContext() => TestDatabase.NewContext();

    public Task InitializeAsync() => TestDatabase.EnsureMigratedAsync();

    public async Task DisposeAsync()
    {
        await using var db = NewContext();

        // Sessions first, in a save of their own; see OfflineReplayTests.
        db.Workouts.RemoveRange(
            await db.Workouts.Where(w => w.UserId == _userId || w.UserId == _otherUserId).ToListAsync());
        await db.SaveChangesAsync();

        db.TrainingPlans.RemoveRange(
            await db.TrainingPlans.Where(p => p.UserId == _userId || p.UserId == _otherUserId).ToListAsync());
        await db.SaveChangesAsync();
    }

    private HttpClient Mine() => factory.ClientFor(_userId);
    private HttpClient Theirs() => factory.ClientFor(_otherUserId);

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    /// A session holding bench press, with the given sets already logged.
    private async Task<(Guid WorkoutId, Guid RowId, Guid[] SetIds)> SessionAsync(
        HttpClient client, DateOnly performedAt, params (decimal Kg, int Reps)[] sets)
    {
        var workoutId = Guid.CreateVersion7();
        var rowId = Guid.CreateVersion7();

        (await client.PostAsJsonAsync("/api/Workouts", new
        {
            id = workoutId, name = "Push", performedAt, notes = (string?)null,
        })).EnsureSuccessStatusCode();

        (await client.PostAsJsonAsync($"/api/Workouts/{workoutId}/exercises", new
        {
            id = rowId, exerciseId = BenchPress, orderIndex = 0,
            targetSets = (int?)null, targetReps = (int?)null, restSeconds = (int?)null,
        })).EnsureSuccessStatusCode();

        var setIds = new Guid[sets.Length];
        for (var i = 0; i < sets.Length; i++)
        {
            setIds[i] = Guid.CreateVersion7();
            (await client.PostAsJsonAsync($"/api/Exercises/{rowId}/sets", new
            {
                id = setIds[i], weightKg = sets[i].Kg, reps = sets[i].Reps, orderIndex = i,
            })).EnsureSuccessStatusCode();
        }

        return (workoutId, rowId, setIds);
    }

    // ------------------------------------------------------------------ sets

    [Fact]
    public async Task A_set_can_be_corrected_and_the_replay_changes_nothing()
    {
        var (_, _, setIds) = await SessionAsync(Mine(), Today, (100m, 5));

        for (var attempt = 0; attempt < 2; attempt++)
        {
            var response = await Mine().PutAsJsonAsync($"/api/Exercises/sets/{setIds[0]}", new { weightKg = 102.5m, reps = 4 });
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        await using var db = NewContext();
        var set = await db.Sets.SingleAsync(s => s.Id == setIds[0]);
        Assert.Equal(102.5m, set.WeightKg);
        Assert.Equal(4, set.Reps);
    }

    [Fact]
    public async Task A_correction_is_held_to_the_same_limits_as_logging()
    {
        var (_, _, setIds) = await SessionAsync(Mine(), Today, (100m, 5));

        var response = await Mine().PutAsJsonAsync($"/api/Exercises/sets/{setIds[0]}", new { weightKg = 100m, reps = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Someone_elses_set_can_be_neither_corrected_nor_deleted()
    {
        var (_, _, setIds) = await SessionAsync(Theirs(), Today, (60m, 10));

        var edit = await Mine().PutAsJsonAsync($"/api/Exercises/sets/{setIds[0]}", new { weightKg = 1m, reps = 1 });
        Assert.Equal(HttpStatusCode.NotFound, edit.StatusCode);

        // Answered like any missing set, so it says nothing about whose it is.
        var delete = await Mine().DeleteAsync($"/api/Exercises/sets/{setIds[0]}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        await using var db = NewContext();
        var set = await db.Sets.SingleAsync(s => s.Id == setIds[0]);
        Assert.Equal(60m, set.WeightKg);
    }

    [Fact]
    public async Task Deleting_a_set_twice_succeeds_both_times()
    {
        var (_, _, setIds) = await SessionAsync(Mine(), Today, (100m, 5), (100m, 5));

        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Exercises/sets/{setIds[0]}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Exercises/sets/{setIds[0]}")).StatusCode);

        await using var db = NewContext();
        Assert.False(await db.Sets.AnyAsync(s => s.Id == setIds[0]));
        Assert.True(await db.Sets.AnyAsync(s => s.Id == setIds[1]));
    }

    // ------------------------------------------------------- exercises and sessions

    [Fact]
    public async Task Removing_an_exercise_takes_its_sets_and_leaves_the_session()
    {
        var (workoutId, rowId, setIds) = await SessionAsync(Mine(), Today, (100m, 5));

        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Workouts/exercises/{rowId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Workouts/exercises/{rowId}")).StatusCode);

        await using var db = NewContext();
        Assert.False(await db.WorkoutExercises.AnyAsync(e => e.Id == rowId));
        Assert.False(await db.Sets.AnyAsync(s => s.Id == setIds[0]));
        Assert.True(await db.Workouts.AnyAsync(w => w.Id == workoutId));
    }

    [Fact]
    public async Task Deleting_a_session_takes_everything_in_it_and_the_replay_succeeds()
    {
        var (workoutId, rowId, setIds) = await SessionAsync(Mine(), Today, (100m, 5));

        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Workouts/{workoutId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Workouts/{workoutId}")).StatusCode);

        await using var db = NewContext();
        Assert.False(await db.Workouts.AnyAsync(w => w.Id == workoutId));
        Assert.False(await db.WorkoutExercises.AnyAsync(e => e.Id == rowId));
        Assert.False(await db.Sets.AnyAsync(s => s.Id == setIds[0]));
    }

    [Fact]
    public async Task Someone_elses_session_survives_a_delete_aimed_at_it()
    {
        var (workoutId, _, _) = await SessionAsync(Theirs(), Today, (60m, 10));

        Assert.Equal(HttpStatusCode.NoContent, (await Mine().DeleteAsync($"/api/Workouts/{workoutId}")).StatusCode);

        await using var db = NewContext();
        Assert.True(await db.Workouts.AnyAsync(w => w.Id == workoutId));
    }

    // ------------------------------------------------------------------ last time

    [Fact]
    public async Task A_session_shows_the_sets_from_the_one_before_it()
    {
        var (earlier, _, _) = await SessionAsync(Mine(), Today.AddDays(-7), (80m, 8), (85m, 6));
        var (later, _, _) = await SessionAsync(Mine(), Today, (90m, 5));

        var current = await Mine().GetFromJsonAsync<WorkoutResponse>($"/api/Workouts/{later}");
        var last = Assert.Single(current!.Exercises).LastPerformance;

        Assert.NotNull(last);
        Assert.Equal(Today.AddDays(-7), last.PerformedAt);
        Assert.Equal([(80m, 8), (85m, 6)], last.Sets.Select(s => (s.WeightKg, s.Reps)));

        // Looked at from the first session, there is nothing before it - the later one
        // must not leak backwards.
        var first = await Mine().GetFromJsonAsync<WorkoutResponse>($"/api/Workouts/{earlier}");
        Assert.Null(Assert.Single(first!.Exercises).LastPerformance);
    }

    [Fact]
    public async Task An_exercise_added_but_never_lifted_is_not_last_time()
    {
        await SessionAsync(Mine(), Today.AddDays(-7), (80m, 8));
        await SessionAsync(Mine(), Today.AddDays(-3));
        var (current, _, _) = await SessionAsync(Mine(), Today);

        var workout = await Mine().GetFromJsonAsync<WorkoutResponse>($"/api/Workouts/{current}");
        var last = Assert.Single(workout!.Exercises).LastPerformance;

        Assert.NotNull(last);
        Assert.Equal(Today.AddDays(-7), last.PerformedAt);
    }

    [Fact]
    public async Task Last_time_never_comes_from_someone_else()
    {
        await SessionAsync(Theirs(), Today.AddDays(-1), (200m, 1));
        var (current, _, _) = await SessionAsync(Mine(), Today);

        var workout = await Mine().GetFromJsonAsync<WorkoutResponse>($"/api/Workouts/{current}");

        Assert.Null(Assert.Single(workout!.Exercises).LastPerformance);
    }

    [Fact]
    public async Task A_plan_day_carries_the_latest_session_for_each_exercise()
    {
        // The phone copies the hint from the day when a session is started from it, often
        // with no signal - so the day has to carry it.
        var planId = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();

        (await Mine().PostAsJsonAsync("/api/training-plans", new { id = planId, name = "Plan", notes = (string?)null }))
            .EnsureSuccessStatusCode();
        (await Mine().PostAsJsonAsync($"/api/training-plans/{planId}/days", new { id = dayId, name = "Push", notes = (string?)null }))
            .EnsureSuccessStatusCode();
        (await Mine().PutAsJsonAsync($"/api/training-plans/days/{dayId}/exercises", new
        {
            exercises = new[] { new { planDayExerciseId = (Guid?)Guid.CreateVersion7(), exerciseId = (Guid?)BenchPress, customExerciseName = (string?)null } },
        })).EnsureSuccessStatusCode();

        await SessionAsync(Mine(), Today.AddDays(-7), (80m, 8));
        await SessionAsync(Mine(), Today.AddDays(-2), (90m, 5), (90m, 5));

        var day = await Mine().GetFromJsonAsync<PlanDayResponse>($"/api/training-plans/days/{dayId}");
        var last = Assert.Single(day!.Exercises).LastPerformance;

        Assert.NotNull(last);
        Assert.Equal(Today.AddDays(-2), last.PerformedAt);
        Assert.Equal(2, last.Sets.Count);
    }
}
