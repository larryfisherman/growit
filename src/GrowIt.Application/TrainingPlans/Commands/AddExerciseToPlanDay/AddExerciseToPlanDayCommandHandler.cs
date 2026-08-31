using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace GrowIt.Application.TrainingPlans.Commands.AddExerciseToPlanDay;

public class AddExerciseToPlanDayCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<AddExerciseToPlanDayCommand, Guid>
{
    public async Task<Guid> Handle(AddExerciseToPlanDayCommand request, CancellationToken cancellationToken)
    {
        var dayExists = await dbContext.TrainingPlanDays
            .AnyAsync(d => d.Id == request.PlanDayId && d.Plan.UserId == request.UserId, cancellationToken);

        if (!dayExists)
        {
            throw new KeyNotFoundException($"Plan day {request.PlanDayId} not found");
        }

        var lastOrderIndex = await dbContext.TrainingPlanDayExercises
            .Where(e => e.PlanDayId == request.PlanDayId)
            .MaxAsync(e => (int?)e.OrderIndex, cancellationToken) ?? -1;

        var exercise = new TrainingPlanDayExercise
        {
            Id = Guid.NewGuid(),
            PlanDayId = request.PlanDayId,
            ExerciseId = request.ExerciseId,
            CustomExerciseName = request.CustomExerciseName,
            TargetSets = request.TargetSets,
            TargetReps = request.TargetReps,
            RestSeconds = request.RestSeconds,
            OrderIndex = lastOrderIndex + 1
        };

        dbContext.TrainingPlanDayExercises.Add(exercise);
        await dbContext.SaveChangesAsync(cancellationToken);

        return exercise.Id;
    }
}
