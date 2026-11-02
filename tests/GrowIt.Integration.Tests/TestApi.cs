using System.Net.Http.Json;
using GrowIt.Infrastructure.Persistence.Seed;

namespace GrowIt.Integration.Tests;

/// Setup shared by the tests that drive the API over HTTP, so they build their starting
/// data through the same requests the app sends.
internal static class TestApi
{
    /// A plan with one day holding bench press, built over HTTP the way the app builds it.
    internal static async Task<(Guid PlanId, Guid DayId, Guid RowId)> PlanWithBenchDayAsync(this HttpClient client)
    {
        var planId = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();
        var rowId = Guid.CreateVersion7();

        (await client.PostAsJsonAsync("/api/training-plans", new { id = planId, name = "Plan", notes = (string?)null }))
            .EnsureSuccessStatusCode();
        (await client.PostAsJsonAsync($"/api/training-plans/{planId}/days", new { id = dayId, name = "Push", notes = (string?)null }))
            .EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync($"/api/training-plans/days/{dayId}/exercises", new
        {
            exercises = new[] { new { planDayExerciseId = (Guid?)rowId, exerciseId = (Guid?)ExerciseSeed.BenchPress, customExerciseName = (string?)null } },
        })).EnsureSuccessStatusCode();

        return (planId, dayId, rowId);
    }
}
