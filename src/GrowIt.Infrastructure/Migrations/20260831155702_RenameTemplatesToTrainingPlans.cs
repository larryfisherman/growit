using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrowIt.Infrastructure.Migrations
{
    /// <summary>
    /// Templates become days of a training plan. Written by hand rather than scaffolded:
    /// the generated version dropped and recreated the tables, which would have thrown
    /// away every existing template. This renames them in place and backfills a plan for
    /// each user that already had templates.
    /// </summary>
    public partial class RenameTemplatesToTrainingPlans : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workouts_WorkoutTemplates_TemplateId",
                table: "Workouts");

            migrationBuilder.DropForeignKey(
                name: "FK_TemplateExercises_WorkoutTemplates_TemplateId",
                table: "TemplateExercises");

            migrationBuilder.DropForeignKey(
                name: "FK_TemplateExercises_Exercises_ExerciseId",
                table: "TemplateExercises");

            // --- rename the tables and the columns pointing at them ---

            migrationBuilder.RenameTable(name: "WorkoutTemplates", newName: "TrainingPlanDays");
            migrationBuilder.RenameTable(name: "TemplateExercises", newName: "TrainingPlanDayExercises");

            migrationBuilder.RenameColumn(
                name: "TemplateId", table: "Workouts", newName: "PlanDayId");
            migrationBuilder.RenameIndex(
                name: "IX_Workouts_TemplateId", table: "Workouts", newName: "IX_Workouts_PlanDayId");

            migrationBuilder.RenameColumn(
                name: "TemplateId", table: "TrainingPlanDayExercises", newName: "PlanDayId");
            migrationBuilder.RenameIndex(
                name: "IX_TemplateExercises_TemplateId",
                table: "TrainingPlanDayExercises",
                newName: "IX_TrainingPlanDayExercises_PlanDayId");
            migrationBuilder.RenameIndex(
                name: "IX_TemplateExercises_ExerciseId",
                table: "TrainingPlanDayExercises",
                newName: "IX_TrainingPlanDayExercises_ExerciseId");

            // --- the new level above the days ---

            migrationBuilder.CreateTable(
                name: "TrainingPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingPlans", x => x.Id);
                });

            // Nullable to begin with so existing rows can be backfilled before the
            // constraint is tightened below.
            migrationBuilder.AddColumn<Guid>(
                name: "PlanId", table: "TrainingPlanDays", type: "uuid", nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderIndex", table: "TrainingPlanDays", type: "integer", nullable: false, defaultValue: 0);

            // --- backfill: one plan per user that already had templates ---

            migrationBuilder.Sql("""
                INSERT INTO "TrainingPlans" ("Id", "UserId", "Name", "Notes", "IsActive", "CreatedAt")
                SELECT gen_random_uuid(), u."UserId", 'Mój plan', NULL, TRUE, NOW() AT TIME ZONE 'UTC'
                FROM (SELECT DISTINCT "UserId" FROM "TrainingPlanDays") AS u;
                """);

            migrationBuilder.Sql("""
                UPDATE "TrainingPlanDays" AS d
                SET "PlanId" = p."Id"
                FROM "TrainingPlans" AS p
                WHERE p."UserId" = d."UserId";
                """);

            // Existing days keep the order they were created in.
            migrationBuilder.Sql("""
                UPDATE "TrainingPlanDays" AS d
                SET "OrderIndex" = ordered.position - 1
                FROM (
                    SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "PlanId" ORDER BY "CreatedAt") AS position
                    FROM "TrainingPlanDays"
                ) AS ordered
                WHERE ordered."Id" = d."Id";
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "PlanId", table: "TrainingPlanDays", type: "uuid", nullable: false,
                oldClrType: typeof(Guid), oldType: "uuid", oldNullable: true);

            // Ownership now hangs off the plan, so the day no longer carries it.
            migrationBuilder.DropColumn(name: "UserId", table: "TrainingPlanDays");

            // --- put the keys back under the new names ---

            migrationBuilder.CreateIndex(
                name: "IX_TrainingPlanDays_PlanId", table: "TrainingPlanDays", column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingPlans_UserId", table: "TrainingPlans", column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TrainingPlanDays_TrainingPlans_PlanId",
                table: "TrainingPlanDays",
                column: "PlanId",
                principalTable: "TrainingPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TrainingPlanDayExercises_TrainingPlanDays_PlanDayId",
                table: "TrainingPlanDayExercises",
                column: "PlanDayId",
                principalTable: "TrainingPlanDays",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TrainingPlanDayExercises_Exercises_ExerciseId",
                table: "TrainingPlanDayExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Workouts_TrainingPlanDays_PlanDayId",
                table: "Workouts",
                column: "PlanDayId",
                principalTable: "TrainingPlanDays",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workouts_TrainingPlanDays_PlanDayId", table: "Workouts");
            migrationBuilder.DropForeignKey(
                name: "FK_TrainingPlanDayExercises_TrainingPlanDays_PlanDayId", table: "TrainingPlanDayExercises");
            migrationBuilder.DropForeignKey(
                name: "FK_TrainingPlanDayExercises_Exercises_ExerciseId", table: "TrainingPlanDayExercises");
            migrationBuilder.DropForeignKey(
                name: "FK_TrainingPlanDays_TrainingPlans_PlanId", table: "TrainingPlanDays");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId", table: "TrainingPlanDays", type: "uuid", nullable: false,
                defaultValue: Guid.Empty);

            // Ownership moves back onto the day before the plans disappear.
            migrationBuilder.Sql("""
                UPDATE "TrainingPlanDays" AS d
                SET "UserId" = p."UserId"
                FROM "TrainingPlans" AS p
                WHERE p."Id" = d."PlanId";
                """);

            migrationBuilder.DropIndex(name: "IX_TrainingPlanDays_PlanId", table: "TrainingPlanDays");
            migrationBuilder.DropIndex(name: "IX_TrainingPlans_UserId", table: "TrainingPlans");
            migrationBuilder.DropColumn(name: "PlanId", table: "TrainingPlanDays");
            migrationBuilder.DropColumn(name: "OrderIndex", table: "TrainingPlanDays");
            migrationBuilder.DropTable(name: "TrainingPlans");

            migrationBuilder.RenameColumn(
                name: "PlanDayId", table: "TrainingPlanDayExercises", newName: "TemplateId");
            migrationBuilder.RenameIndex(
                name: "IX_TrainingPlanDayExercises_PlanDayId",
                table: "TrainingPlanDayExercises",
                newName: "IX_TemplateExercises_TemplateId");
            migrationBuilder.RenameIndex(
                name: "IX_TrainingPlanDayExercises_ExerciseId",
                table: "TrainingPlanDayExercises",
                newName: "IX_TemplateExercises_ExerciseId");

            migrationBuilder.RenameColumn(name: "PlanDayId", table: "Workouts", newName: "TemplateId");
            migrationBuilder.RenameIndex(
                name: "IX_Workouts_PlanDayId", table: "Workouts", newName: "IX_Workouts_TemplateId");

            migrationBuilder.RenameTable(name: "TrainingPlanDayExercises", newName: "TemplateExercises");
            migrationBuilder.RenameTable(name: "TrainingPlanDays", newName: "WorkoutTemplates");

            migrationBuilder.AddForeignKey(
                name: "FK_TemplateExercises_WorkoutTemplates_TemplateId",
                table: "TemplateExercises",
                column: "TemplateId",
                principalTable: "WorkoutTemplates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TemplateExercises_Exercises_ExerciseId",
                table: "TemplateExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Workouts_WorkoutTemplates_TemplateId",
                table: "Workouts",
                column: "TemplateId",
                principalTable: "WorkoutTemplates",
                principalColumn: "Id");
        }
    }
}
