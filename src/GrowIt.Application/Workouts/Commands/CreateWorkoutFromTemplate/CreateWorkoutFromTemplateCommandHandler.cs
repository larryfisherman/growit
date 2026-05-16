using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.Workouts.Commands.CreateWorkoutFromTemplate;

public class CreateWorkoutFromTemplateCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<CreateWorkoutFromTemplateCommand, Guid>
{
    public async Task<Guid> Handle(CreateWorkoutFromTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await dbContext.WorkoutTemplates
            .Include(t => t.TemplateExercises)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId, cancellationToken)
            ?? throw new KeyNotFoundException($"Template {request.TemplateId} not found");

        var workout = new Workout
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Name = template.Name,
            PerformedAt = request.PerformedAt,
            CreatedAt = DateTime.UtcNow,
            TemplateId = template.Id,
            WorkoutExercises = template.TemplateExercises
                .OrderBy(te => te.OrderIndex)
                .Select(te => new WorkoutExercise
                {
                    Id = Guid.NewGuid(),
                    ExerciseId = te.ExerciseId,
                    CustomExerciseName = te.CustomExerciseName,
                    TargetSets = te.TargetSets,
                    TargetReps = te.TargetReps,
                    RestSeconds = te.RestSeconds,
                    OrderIndex = te.OrderIndex
                })
                .ToList()
        };

        dbContext.Workouts.Add(workout);
        await dbContext.SaveChangesAsync(cancellationToken);

        return workout.Id;
    }
}
