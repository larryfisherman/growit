using GrowIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Integration.Tests;

/// The database every test in this project talks to.
///
/// A database of its own rather than the one the API uses in development: the tests leave
/// rows behind when they fail half-way, and they should never depend on whatever happens
/// to be sitting in a developer's data. Migrated once per run by whichever test gets here
/// first, so no test class relies on another having booted the API before it.
public static class TestDatabase
{
    public static readonly string ConnectionString =
        Environment.GetEnvironmentVariable("GROWIT_TEST_DB")
        ?? "Host=localhost;Port=5432;Database=growit_test;Username=growit;Password=localdev";

    private static readonly Lazy<Task> Migration = new(async () =>
    {
        await using var db = NewContext();
        await db.Database.MigrateAsync();
    });

    public static GrowItDbContext NewContext() =>
        new(new DbContextOptionsBuilder<GrowItDbContext>().UseNpgsql(ConnectionString).Options);

    public static Task EnsureMigratedAsync() => Migration.Value;
}
