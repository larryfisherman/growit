using GrowIt.Domain.Entities;

namespace GrowIt.Infrastructure.Persistence.Seed;

/// The read-only exercise library every user picks from.
///
/// The ids are fixed because users' plan-day and workout rows reference them by foreign
/// key (and tests use them directly). These rows are migration seed data: changing any
/// value here changes the model and requires a new migration. Names and categories may
/// change that way; an id must never change or be removed while rows still point at it.
public static class ExerciseSeed
{
    public static readonly Guid BenchPress = Guid.Parse("a1b2c3d4-0001-0000-0000-000000000000");
    public static readonly Guid DumbbellPress = Guid.Parse("a1b2c3d4-0002-0000-0000-000000000000");
    public static readonly Guid Deadlift = Guid.Parse("a1b2c3d4-0004-0000-0000-000000000000");

    public static Exercise[] All(DateTime seededAt) =>
    [
        // Chest
        new Exercise { Id = BenchPress, Name = "Wyciskanie sztangi", Category = "Klatka", MuscleGroup = "Klatka piersiowa", CreatedAt = seededAt },
        new Exercise { Id = DumbbellPress, Name = "Wyciskanie hantli", Category = "Klatka", MuscleGroup = "Klatka piersiowa", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0003-0000-0000-000000000000"), Name = "Rozpiętki", Category = "Klatka", MuscleGroup = "Klatka piersiowa", CreatedAt = seededAt },
        // Back
        new Exercise { Id = Deadlift, Name = "Martwy ciąg", Category = "Plecy", MuscleGroup = "Plecy", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0005-0000-0000-000000000000"), Name = "Wiosłowanie sztangą", Category = "Plecy", MuscleGroup = "Plecy", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0006-0000-0000-000000000000"), Name = "Podciąganie", Category = "Plecy", MuscleGroup = "Plecy", CreatedAt = seededAt },
        // Legs
        new Exercise { Id = Guid.Parse("a1b2c3d4-0007-0000-0000-000000000000"), Name = "Przysiad ze sztangą", Category = "Nogi", MuscleGroup = "Nogi", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0008-0000-0000-000000000000"), Name = "Wypychanie nogami", Category = "Nogi", MuscleGroup = "Nogi", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0009-0000-0000-000000000000"), Name = "Wykroki", Category = "Nogi", MuscleGroup = "Nogi", CreatedAt = seededAt },
        // Shoulders
        new Exercise { Id = Guid.Parse("a1b2c3d4-0010-0000-0000-000000000000"), Name = "Wyciskanie żołnierskie", Category = "Barki", MuscleGroup = "Barki", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0011-0000-0000-000000000000"), Name = "Unoszenie bokiem", Category = "Barki", MuscleGroup = "Barki", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0012-0000-0000-000000000000"), Name = "Unoszenie przodem", Category = "Barki", MuscleGroup = "Barki", CreatedAt = seededAt },
        // Triceps
        new Exercise { Id = Guid.Parse("a1b2c3d4-0013-0000-0000-000000000000"), Name = "Wyciskanie wąskim chwytem", Category = "Triceps", MuscleGroup = "Triceps", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0014-0000-0000-000000000000"), Name = "Prostowanie ramion na wyciągu", Category = "Triceps", MuscleGroup = "Triceps", CreatedAt = seededAt },
        // Biceps
        new Exercise { Id = Guid.Parse("a1b2c3d4-0015-0000-0000-000000000000"), Name = "Uginanie ramion ze sztangą", Category = "Biceps", MuscleGroup = "Biceps", CreatedAt = seededAt },
        new Exercise { Id = Guid.Parse("a1b2c3d4-0016-0000-0000-000000000000"), Name = "Uginanie ramion z hantlami", Category = "Biceps", MuscleGroup = "Biceps", CreatedAt = seededAt },
    ];
}
