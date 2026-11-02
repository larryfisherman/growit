using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GrowIt.Integration.Tests;

/// Boots the real HTTP pipeline - model binding, validation, exception mapping and the
/// controllers - against the growit_test database (TestDatabase), with a header-based
/// identity (TestAuthHandler) standing in for Cognito.
public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        // The app reads its connection string while services are registered, before any
        // configuration callback of ours would run, so it has to arrive as a host setting.
        builder.UseSetting("ConnectionStrings:DefaultConnection", TestDatabase.ConnectionString);

        builder.ConfigureTestServices(services =>
        {
            services
                .AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName,
                    _ => { });
        });
    }

    public HttpClient ClientFor(Guid userId)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserHeader, userId.ToString());
        return client;
    }
}
