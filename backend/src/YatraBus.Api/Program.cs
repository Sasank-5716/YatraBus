using Microsoft.AspNetCore.Diagnostics;
using YatraBus.Api.Endpoints;
using YatraBus.Api.Http;
using YatraBus.Application;
using YatraBus.Application.Abstractions;
using YatraBus.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(o => ApiResult.Configure(o.SerializerOptions));
builder.Services.AddInfrastructure(builder.Configuration).AddApplication();
builder.Services.AddScoped<CookieSession>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => o.SwaggerDoc("v1", new() { Title = "Yatra Bus API", Version = "v1" }));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
    scope.ServiceProvider.GetRequiredService<IDataSeeder>().EnsureSeeded();

// Unhandled errors → { error } JSON like the original server.
app.UseExceptionHandler(e => e.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    app.Logger.LogError(ex, "Unhandled error");
    ctx.Response.StatusCode = 500;
    await ctx.Response.WriteAsJsonAsync(new { error = "Something went wrong. Please try again." });
}));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// API responses are never cached.
app.Use(async (ctx, next) =>
{
    if (ctx.Request.Path.StartsWithSegments("/api")) ctx.Response.Headers.CacheControl = "no-store";
    await next();
});

// Production mode: serve the built Angular app from wwwroot (npm run build:backend).
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapAuth();
app.MapCatalogue();
app.MapBookings();
app.MapAdmin();

app.Map("/api/{**rest}", () => ApiResult.Error(404, "Not found"));
app.MapFallbackToFile("index.html");

app.Run();

/// <summary>Exposed for WebApplicationFactory-style tests.</summary>
public partial class Program;
