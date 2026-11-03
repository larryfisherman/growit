using GrowIt.Application.Common.Interfaces;
using GrowIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GrowIt.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Retries transient failures (dropped connection, timeout) - Neon scales to zero, so
        // the first query after idle wakes the compute and can fail once. Kept short so a
        // request stays well inside the Lambda timeout. Retrying is incompatible with manual
        // BeginTransaction calls unless wrapped in the execution strategy; there are none.
        services.AddDbContext<GrowItDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.EnableRetryOnFailure(
                    maxRetryCount: 2,
                    maxRetryDelay: TimeSpan.FromSeconds(2),
                    errorCodesToAdd: null)));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<GrowItDbContext>());

        return services;
    }
}
