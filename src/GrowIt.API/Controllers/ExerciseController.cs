using GrowIt.Application.Exercises.Queries.GetExerciseList;
using GrowIt.Application.Workouts.Commands.LogSet;
using GrowIt.Contracts.Exercises.Requests;
using GrowIt.Contracts.Exercises.Responses;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExercisesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ExerciseResponse>>> GetExercises(CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetExerciseListQuery(), ct);
        return Ok(result);
    }

    [HttpPost("{workoutExerciseId:guid}/sets")]
    public async Task<ActionResult<LogSetResponse>> LogSet(
        Guid workoutExerciseId, [FromBody] LogSetRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new LogSetCommand(workoutExerciseId, request.WeightKg, request.Reps), ct);
        return Ok(new LogSetResponse(id));
    }
}
