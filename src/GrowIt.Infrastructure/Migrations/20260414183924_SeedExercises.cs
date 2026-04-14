using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GrowIt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedExercises : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Exercises",
                columns: new[] { "Id", "Category", "CreatedAt", "MuscleGroup", "Name" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-0001-0000-0000-000000000000"), "Klatka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Klatka piersiowa", "Wyciskanie sztangi" },
                    { new Guid("a1b2c3d4-0002-0000-0000-000000000000"), "Klatka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Klatka piersiowa", "Wyciskanie hantli" },
                    { new Guid("a1b2c3d4-0003-0000-0000-000000000000"), "Klatka", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Klatka piersiowa", "Rozpiętki" },
                    { new Guid("a1b2c3d4-0004-0000-0000-000000000000"), "Plecy", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Plecy", "Martwy ciąg" },
                    { new Guid("a1b2c3d4-0005-0000-0000-000000000000"), "Plecy", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Plecy", "Wiosłowanie sztangą" },
                    { new Guid("a1b2c3d4-0006-0000-0000-000000000000"), "Plecy", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Plecy", "Podciąganie" },
                    { new Guid("a1b2c3d4-0007-0000-0000-000000000000"), "Nogi", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Nogi", "Przysiad ze sztangą" },
                    { new Guid("a1b2c3d4-0008-0000-0000-000000000000"), "Nogi", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Nogi", "Wypychanie nogami" },
                    { new Guid("a1b2c3d4-0009-0000-0000-000000000000"), "Nogi", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Nogi", "Wykroki" },
                    { new Guid("a1b2c3d4-0010-0000-0000-000000000000"), "Barki", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Barki", "Wyciskanie żołnierskie" },
                    { new Guid("a1b2c3d4-0011-0000-0000-000000000000"), "Barki", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Barki", "Unoszenie bokiem" },
                    { new Guid("a1b2c3d4-0012-0000-0000-000000000000"), "Barki", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Barki", "Unoszenie przodem" },
                    { new Guid("a1b2c3d4-0013-0000-0000-000000000000"), "Triceps", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Triceps", "Wyciskanie wąskim chwytem" },
                    { new Guid("a1b2c3d4-0014-0000-0000-000000000000"), "Triceps", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Triceps", "Prostowanie ramion na wyciągu" },
                    { new Guid("a1b2c3d4-0015-0000-0000-000000000000"), "Biceps", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Biceps", "Uginanie ramion ze sztangą" },
                    { new Guid("a1b2c3d4-0016-0000-0000-000000000000"), "Biceps", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Biceps", "Uginanie ramion z hantlami" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0002-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0003-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0004-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0005-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0006-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0007-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0008-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0009-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0010-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0011-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0012-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0013-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0014-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0015-0000-0000-000000000000"));

            migrationBuilder.DeleteData(
                table: "Exercises",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0016-0000-0000-000000000000"));
        }
    }
}
