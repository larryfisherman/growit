using GrowIt.Application.Common.Interfaces;
using GrowIt.Domain.Entities;
using MediatR;

namespace GrowIt.Application.Workouts.Commands.LogSet;

public class LogSetCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<LogSetCommand, Guid>
{
    public async Task<Guid> Handle(LogSetCommand request, CancellationToken cancellationToken)
    {
        var logSet = new Set()
        {
            Id = Guid.NewGuid(),
            WorkoutExerciseId = request.WorkoutExerciseId,
            Reps = request.Reps,
            WeightKg = request.WeightKg,
            OrderIndex = 0
        };

        dbContext.Sets.Add(logSet);
        await dbContext.SaveChangesAsync(cancellationToken);
        return logSet.Id;
    }
}