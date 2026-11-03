using System.Net;
using System.Net.Http.Json;
using GrowIt.Domain.Entities;
using GrowIt.Infrastructure.Persistence.Seed;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Integration.Tests;

/// Everything here goes through HTTP on purpose.
///
/// Each case is a request that used to come back as a 500 or, worse, as a quiet success.
/// That matters more than it sounds: the mobile client reads 5xx as "try again later" and
/// keeps a queued write alive on it forever, while a wrong 200 leaves the user looking at
/// data the server never stored.
public class ApiContractTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly Guid _userId = Guid.CreateVersion7();
    private readonly Guid _strangerId = Guid.CreateVersion7();

    public Task InitializeAsync() => TestDatabase.EnsureMigratedAsync();

    public Task DisposeAsync() => TestDatabase.DeleteUserDataAsync(_userId, _strangerId);

    private HttpClient Mine() => factory.ClientFor(_userId);
    private HttpClient Theirs() => factory.ClientFor(_strangerId);

    [Fact]
    public async Task A_custom_exercise_name_a_session_could_not_copy_is_refused_on_the_day()
    {
        // A session started from a day copies its custom names, and the copy is capped at
        // 100 characters. Accepting a longer name on the day made every later "start this
        // day" fail with a 400 that the offline queue could never get past.
        var (_, dayId, _) = await Mine().PlanWithBenchDayAsync();
        var tooLong = new string('x', 101);

        var replace = await Mine().PutAsJsonAsync($"/api/training-plans/days/{dayId}/exercises", new
        {
            exercises = new[] { new { planDayExerciseId = (Guid?)null, exerciseId = (Guid?)null, customExerciseName = (string?)tooLong } },
        });
        Assert.Equal(HttpStatusCode.BadRequest, replace.StatusCode);

        var atLimit = await Mine().PutAsJsonAsync($"/api/training-plans/days/{dayId}/exercises", new
        {
            exercises = new[] { new { planDayExerciseId = (Guid?)null, exerciseId = (Guid?)null, customExerciseName = (string?)new string('x', 100) } },
        });
        Assert.True(atLimit.IsSuccessStatusCode, $"100 characters must still be accepted, got {atLimit.StatusCode}");
    }

    [Fact]
    public async Task A_day_takes_its_exercises_only_as_a_whole_list()
    {
        // Adding a single exercise by POST was a second way in that drifted from the PUT
        // (its own defaults, no tests) and the app never used it, so it was removed.
        var (_, dayId, _) = await Mine().PlanWithBenchDayAsync();

        var add = await Mine().PostAsJsonAsync($"/api/training-plans/days/{dayId}/exercises", new
        {
            id = Guid.CreateVersion7(), exerciseId = ExerciseSeed.BenchPress, customExerciseName = (string?)null,
            targetSets = 3, targetReps = 10, restSeconds = 90,
        });

        Assert.Equal(HttpStatusCode.MethodNotAllowed, add.StatusCode);
    }

    [Theory]
    [InlineData(0, null, null, 0)]
    [InlineData(null, 0, null, 0)]
    [InlineData(null, null, -1, 0)]
    [InlineData(null, null, null, -1)]
    public async Task A_workout_row_follows_the_plan_row_rules(
        int? targetSets, int? targetReps, int? restSeconds, int orderIndex)
    {
        // Workout rows share the plan-day rules: targets are optional, but when given they
        // must make sense, and a position is never negative.
        var workoutId = Guid.CreateVersion7();
        await Mine().PostAsJsonAsync("/api/Workouts", new
        {
            id = workoutId,
            name = "Trening",
            performedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            notes = (string?)null,
        });

        var response = await Mine().PostAsJsonAsync($"/api/Workouts/{workoutId}/exercises", new
        {
            id = Guid.CreateVersion7(),
            exerciseId = ExerciseSeed.BenchPress,
            orderIndex,
            targetSets,
            targetReps,
            restSeconds,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_copied_session_row_cannot_be_both_a_library_and_a_custom_exercise()
    {
        var (_, dayId, _) = await Mine().PlanWithBenchDayAsync();

        var response = await Mine().PostAsJsonAsync("/api/Workouts/from-plan-day", new
        {
            id = Guid.CreateVersion7(),
            planDayId = dayId,
            performedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            exerciseIds = Array.Empty<object>(),
            name = "Push",
            exercises = new[]
            {
                new
                {
                    workoutExerciseId = Guid.CreateVersion7(),
                    exerciseId = (Guid?)ExerciseSeed.BenchPress,
                    customExerciseName = (string?)"Moje ćwiczenie",
                    targetSets = (int?)3,
                    targetReps = (int?)10,
                    restSeconds = (int?)90,
                    orderIndex = 0,
                },
            },
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_create_without_an_id_is_refused()
    {
        // A Guid is a value type, so leaving the field out of the body does not fail
        // binding - it arrives as Guid.Empty. Unguarded, the first caller to do this took
        // that id for themselves: their own later writes folded into the one row, and
        // every other user was refused for good.
        var response = await Mine().PostAsJsonAsync(
            "/api/training-plans",
            new { name = "Plan bez id", notes = (string?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var db = TestDatabase.NewContext();
        Assert.False(await db.TrainingPlans.AnyAsync(p => p.Id == Guid.Empty));
    }

    [Fact]
    public async Task Replaying_a_create_over_http_leaves_one_row()
    {
        var id = Guid.CreateVersion7();
        var body = new { id, name = "Push/Pull", notes = (string?)null };

        var first = await Mine().PostAsJsonAsync("/api/training-plans", body);
        var second = await Mine().PostAsJsonAsync("/api/training-plans", body);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        await using var db = TestDatabase.NewContext();
        Assert.Equal(1, await db.TrainingPlans.CountAsync(p => p.Id == id));
    }

    [Fact]
    public async Task An_id_another_user_already_holds_comes_back_as_a_conflict()
    {
        var id = Guid.CreateVersion7();
        await Theirs().PostAsJsonAsync("/api/training-plans", new { id, name = "Ich plan", notes = (string?)null });

        var response = await Mine().PostAsJsonAsync(
            "/api/training-plans",
            new { id, name = "Mój plan", notes = (string?)null });

        // 409 and not 500: the client has to know this will never work, so the write is
        // dropped rather than retried until its budget runs out.
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        await using var db = TestDatabase.NewContext();
        var stored = await db.TrainingPlans.FirstAsync(p => p.Id == id);
        Assert.Equal(_strangerId, stored.UserId);
    }

    [Fact]
    public async Task Mapping_the_same_plan_day_exercise_twice_is_refused()
    {
        var planDayId = Guid.CreateVersion7();

        var response = await Mine().PostAsJsonAsync("/api/Workouts/from-plan-day", new
        {
            id = Guid.CreateVersion7(),
            planDayId,
            performedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            exerciseIds = new[]
            {
                new { planDayExerciseId = planDayId, workoutExerciseId = Guid.CreateVersion7() },
                new { planDayExerciseId = planDayId, workoutExerciseId = Guid.CreateVersion7() },
            },
        });

        // Used to reach ToDictionary and throw, which surfaced as 500 - a permanent
        // failure the queue would have retried without end.
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Adding_an_exercise_that_does_not_exist_is_not_a_server_error()
    {
        var workoutId = Guid.CreateVersion7();
        await Mine().PostAsJsonAsync("/api/Workouts", new
        {
            id = workoutId,
            name = "Trening",
            performedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            notes = (string?)null,
        });

        var response = await Mine().PostAsJsonAsync($"/api/Workouts/{workoutId}/exercises", new
        {
            id = Guid.CreateVersion7(),
            // Nothing in the library - the client can hold a stale copy of it indefinitely.
            exerciseId = Guid.CreateVersion7(),
            orderIndex = 0,
            targetSets = (int?)null,
            targetReps = (int?)null,
            restSeconds = (int?)null,
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task An_exercise_from_the_library_is_accepted()
    {
        var workoutId = Guid.CreateVersion7();
        await Mine().PostAsJsonAsync("/api/Workouts", new
        {
            id = workoutId,
            name = "Trening",
            performedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            notes = (string?)null,
        });

        var response = await Mine().PostAsJsonAsync($"/api/Workouts/{workoutId}/exercises", new
        {
            id = Guid.CreateVersion7(),
            exerciseId = ExerciseSeed.BenchPress,
            orderIndex = 2,
            targetSets = (int?)null,
            targetReps = (int?)null,
            restSeconds = (int?)null,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // The position is the client's to decide now; the server used to pin every row to 0.
        await using var db = TestDatabase.NewContext();
        var stored = await db.WorkoutExercises.FirstAsync(e => e.WorkoutId == workoutId);
        Assert.Equal(2, stored.OrderIndex);
    }

    [Fact]
    public async Task A_page_number_below_one_is_refused()
    {
        // Skip((page - 1) * pageSize) turned this into a negative OFFSET, which Postgres
        // rejects outright - a 500 reachable from a query string.
        var response = await Mine().GetAsync($"/api/Workouts/history?page=0");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_set_cannot_be_logged_into_someone_elses_workout()
    {
        var workoutId = Guid.CreateVersion7();
        await Theirs().PostAsJsonAsync("/api/Workouts", new
        {
            id = workoutId,
            name = "Ich trening",
            performedAt = DateOnly.FromDateTime(DateTime.UtcNow),
            notes = (string?)null,
        });

        var exerciseId = Guid.CreateVersion7();
        await Theirs().PostAsJsonAsync($"/api/Workouts/{workoutId}/exercises", new
        {
            id = exerciseId,
            exerciseId = ExerciseSeed.BenchPress,
            orderIndex = 0,
            targetSets = (int?)null,
            targetReps = (int?)null,
            restSeconds = (int?)null,
        });

        var response = await Mine().PostAsJsonAsync($"/api/Exercises/{exerciseId}/sets", new
        {
            id = Guid.CreateVersion7(),
            weightKg = 100m,
            reps = 5,
            orderIndex = 0,
        });

        // Missing and not-yours answer alike on purpose: confirming that someone else's
        // id exists would leak it.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        await using var db = TestDatabase.NewContext();
        Assert.False(await db.Sets.AnyAsync(s => s.WorkoutExerciseId == exerciseId));
    }
}
