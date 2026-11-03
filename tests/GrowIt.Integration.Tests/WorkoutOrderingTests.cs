using System.Net.Http.Json;
using GrowIt.Contracts.Workouts.Responses;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Integration.Tests;

/// Two sessions can share a training date (a morning and an evening one, or a session
/// recorded twice). Every list and lookup must then agree on one order: newest date first,
/// and on a shared date the most recently recorded session first.
public class WorkoutOrderingTests(ApiFactory factory) : IClassFixture<ApiFactory>, IAsyncLifetime
{
    private readonly Guid _userId = Guid.CreateVersion7();

    public Task InitializeAsync() => TestDatabase.EnsureMigratedAsync();

    public Task DisposeAsync() => TestDatabase.DeleteUserDataAsync(_userId);

    private HttpClient Mine() => factory.ClientFor(_userId);

    private static readonly DateOnly SharedDate = new(2026, 3, 10);
    private static readonly DateOnly EarlierDate = new(2026, 3, 2);

    private async Task<Guid> SessionAsync(string name, DateOnly performedAt)
    {
        var id = Guid.CreateVersion7();
        (await Mine().PostAsJsonAsync("/api/Workouts", new
        {
            id, name, performedAt, notes = (string?)null,
        })).EnsureSuccessStatusCode();
        return id;
    }

    /// Pins when each session was recorded, so the test does not depend on how fast the
    /// requests ran or on the order Postgres happens to store the rows in.
    private static async Task RecordedAtAsync(Guid workoutId, DateTime createdAt)
    {
        await using var db = TestDatabase.NewContext();
        await db.Workouts
            .Where(w => w.Id == workoutId)
            .ExecuteUpdateAsync(s => s.SetProperty(w => w.CreatedAt, createdAt));
    }

    [Fact]
    public async Task The_day_view_shows_the_most_recently_recorded_session_of_that_date()
    {
        var first = await SessionAsync("Morning", SharedDate);
        var second = await SessionAsync("Evening", SharedDate);
        var baseTime = new DateTime(2026, 3, 10, 8, 0, 0, DateTimeKind.Utc);

        await RecordedAtAsync(first, baseTime);
        await RecordedAtAsync(second, baseTime.AddHours(10));
        var shown = await Mine().GetFromJsonAsync<WorkoutByDateResponse>(
            $"/api/Workouts/by-date?date={SharedDate:yyyy-MM-dd}");
        Assert.Equal(second, shown!.Id);

        // Swap which one was recorded later: the answer follows the record time, not the
        // order the rows were inserted in.
        await RecordedAtAsync(first, baseTime.AddHours(12));
        shown = await Mine().GetFromJsonAsync<WorkoutByDateResponse>(
            $"/api/Workouts/by-date?date={SharedDate:yyyy-MM-dd}");
        Assert.Equal(first, shown!.Id);
    }

    [Fact]
    public async Task History_and_month_lists_order_sessions_on_the_same_date_newest_recorded_first()
    {
        var older = await SessionAsync("Older date", EarlierDate);
        var first = await SessionAsync("Morning", SharedDate);
        var second = await SessionAsync("Evening", SharedDate);
        var baseTime = new DateTime(2026, 3, 10, 8, 0, 0, DateTimeKind.Utc);

        // Recorded out of insertion order on purpose.
        await RecordedAtAsync(older, baseTime.AddDays(-8));
        await RecordedAtAsync(first, baseTime.AddHours(10));
        await RecordedAtAsync(second, baseTime);
        Guid[] expected = [first, second, older];

        var history = await Mine().GetFromJsonAsync<WorkoutHistoryResponse>(
            $"/api/Workouts/history?page=1&pageSize=20");
        Assert.Equal(expected, history!.Items.Select(w => w.Id));

        var month = await Mine().GetFromJsonAsync<List<WorkoutSummaryResponse>>(
            $"/api/Workouts/by-month?year=2026&month=3");
        Assert.Equal(expected, month!.Select(w => w.Id));

        // Pages of one never repeat or skip a session.
        var paged = new List<Guid>();
        for (var page = 1; page <= expected.Length; page++)
        {
            var onePage = await Mine().GetFromJsonAsync<WorkoutHistoryResponse>(
                $"/api/Workouts/history?page={page}&pageSize=1");
            paged.AddRange(onePage!.Items.Select(w => w.Id));
        }
        Assert.Equal(expected, paged);
    }
}
