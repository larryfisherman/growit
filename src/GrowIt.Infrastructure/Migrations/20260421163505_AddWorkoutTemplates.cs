using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrowIt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutExercises_Exercises_ExerciseId",
                table: "WorkoutExercises");

            migrationBuilder.AlterColumn<Guid>(
                name: "ExerciseId",
                table: "WorkoutExercises",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "CustomExerciseName",
                table: "WorkoutExercises",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RestSeconds",
                table: "WorkoutExercises",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetReps",
                table: "WorkoutExercises",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TargetSets",
                table: "WorkoutExercises",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WorkoutTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TemplateExercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExerciseId = table.Column<Guid>(type: "uuid", nullable: true),
                    CustomExerciseName = table.Column<string>(type: "text", nullable: true),
                    TargetSets = table.Column<int>(type: "integer", nullable: false),
                    TargetReps = table.Column<int>(type: "integer", nullable: false),
                    RestSeconds = table.Column<int>(type: "integer", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateExercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplateExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TemplateExercises_WorkoutTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "WorkoutTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateExercises_ExerciseId",
                table: "TemplateExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateExercises_TemplateId",
                table: "TemplateExercises",
                column: "TemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutExercises_Exercises_ExerciseId",
                table: "WorkoutExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutExercises_Exercises_ExerciseId",
                table: "WorkoutExercises");

            migrationBuilder.DropTable(
                name: "TemplateExercises");

            migrationBuilder.DropTable(
                name: "WorkoutTemplates");

            migrationBuilder.DropColumn(
                name: "CustomExerciseName",
                table: "WorkoutExercises");

            migrationBuilder.DropColumn(
                name: "RestSeconds",
                table: "WorkoutExercises");

            migrationBuilder.DropColumn(
                name: "TargetReps",
                table: "WorkoutExercises");

            migrationBuilder.DropColumn(
                name: "TargetSets",
                table: "WorkoutExercises");

            migrationBuilder.AlterColumn<Guid>(
                name: "ExerciseId",
                table: "WorkoutExercises",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutExercises_Exercises_ExerciseId",
                table: "WorkoutExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
