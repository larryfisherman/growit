using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrowIt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutTemplateOrigin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TemplateId",
                table: "Workouts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Workouts_TemplateId",
                table: "Workouts",
                column: "TemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workouts_WorkoutTemplates_TemplateId",
                table: "Workouts",
                column: "TemplateId",
                principalTable: "WorkoutTemplates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workouts_WorkoutTemplates_TemplateId",
                table: "Workouts");

            migrationBuilder.DropIndex(
                name: "IX_Workouts_TemplateId",
                table: "Workouts");

            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "Workouts");
        }
    }
}
