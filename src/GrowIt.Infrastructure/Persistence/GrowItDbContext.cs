using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Infrastructure.Persistence;

public class GrowItDbContext(DbContextOptions<GrowItDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<Set> Sets => Set<Set>();
    public DbSet<WorkoutTemplate> WorkoutTemplates => Set<WorkoutTemplate>();
    public DbSet<TemplateExercise> TemplateExercises => Set<TemplateExercise>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GrowItDbContext).Assembly);

        var seededAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Exercise>().HasData(
            // Klatka
            new Exercise { Id = Guid.Parse("a1b2c3d4-0001-0000-0000-000000000000"), Name = "Wyciskanie sztangi", Category = "Klatka", MuscleGroup = "Klatka piersiowa", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0002-0000-0000-000000000000"), Name = "Wyciskanie hantli", Category = "Klatka", MuscleGroup = "Klatka piersiowa", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0003-0000-0000-000000000000"), Name = "Rozpiętki", Category = "Klatka", MuscleGroup = "Klatka piersiowa", CreatedAt = seededAt },
            // Plecy
            new Exercise { Id = Guid.Parse("a1b2c3d4-0004-0000-0000-000000000000"), Name = "Martwy ciąg", Category = "Plecy", MuscleGroup = "Plecy", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0005-0000-0000-000000000000"), Name = "Wiosłowanie sztangą", Category = "Plecy", MuscleGroup = "Plecy", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0006-0000-0000-000000000000"), Name = "Podciąganie", Category = "Plecy", MuscleGroup = "Plecy", CreatedAt = seededAt },
            // Nogi
            new Exercise { Id = Guid.Parse("a1b2c3d4-0007-0000-0000-000000000000"), Name = "Przysiad ze sztangą", Category = "Nogi", MuscleGroup = "Nogi", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0008-0000-0000-000000000000"), Name = "Wypychanie nogami", Category = "Nogi", MuscleGroup = "Nogi", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0009-0000-0000-000000000000"), Name = "Wykroki", Category = "Nogi", MuscleGroup = "Nogi", CreatedAt = seededAt },
            // Barki
            new Exercise { Id = Guid.Parse("a1b2c3d4-0010-0000-0000-000000000000"), Name = "Wyciskanie żołnierskie", Category = "Barki", MuscleGroup = "Barki", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0011-0000-0000-000000000000"), Name = "Unoszenie bokiem", Category = "Barki", MuscleGroup = "Barki", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0012-0000-0000-000000000000"), Name = "Unoszenie przodem", Category = "Barki", MuscleGroup = "Barki", CreatedAt = seededAt },
            // Triceps
            new Exercise { Id = Guid.Parse("a1b2c3d4-0013-0000-0000-000000000000"), Name = "Wyciskanie wąskim chwytem", Category = "Triceps", MuscleGroup = "Triceps", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0014-0000-0000-000000000000"), Name = "Prostowanie ramion na wyciągu", Category = "Triceps", MuscleGroup = "Triceps", CreatedAt = seededAt },
            // Biceps
            new Exercise { Id = Guid.Parse("a1b2c3d4-0015-0000-0000-000000000000"), Name = "Uginanie ramion ze sztangą", Category = "Biceps", MuscleGroup = "Biceps", CreatedAt = seededAt },
            new Exercise { Id = Guid.Parse("a1b2c3d4-0016-0000-0000-000000000000"), Name = "Uginanie ramion z hantlami", Category = "Biceps", MuscleGroup = "Biceps", CreatedAt = seededAt }
        );
    }
}
