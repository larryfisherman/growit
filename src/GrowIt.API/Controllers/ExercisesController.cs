using GrowIt.API.Authorization;
using GrowIt.Application.Exercises.Queries.GetExerciseList;
using GrowIt.Application.Workouts.Commands.DeleteSet;
using GrowIt.Application.Workouts.Commands.LogSet;
using GrowIt.Application.Workouts.Commands.UpdateSet;
using GrowIt.Contracts.Exercises.Responses;
using GrowIt.Contracts.Workouts.Requests;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ExercisesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ExerciseResponse>>> GetExercises(CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetExerciseListQuery(), ct);
        return Ok(result);
    }

    // The set endpoints below dispatch Workouts commands: {workoutExerciseId} is a workout-row id,
    // not a library exercise id. They live under api/Exercises for historical reasons and must stay
    // here, because the generated mobile client (mobile/src/api/generated/exercises) calls them by this path.
    [HttpPost("{workoutExerciseId:guid}/sets")]
    public async Task<ActionResult<LogSetResponse>> LogSet(
        Guid workoutExerciseId, [FromBody] LogSetRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new LogSetCommand(
            request.Id,
            HttpContext.GetUserId(),
            workoutExerciseId,
            request.WeightKg,
            request.Reps,
            request.OrderIndex), ct);
        return Ok(new LogSetResponse(id));
    }

    [HttpPut("sets/{setId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdateSet(Guid setId, [FromBody] UpdateSetRequest request, CancellationToken ct)
    {
        await mediator.Send(
            new UpdateSetCommand(HttpContext.GetUserId(), setId, request.WeightKg, request.Reps), ct);
        return NoContent();
    }

    [HttpDelete("sets/{setId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteSet(Guid setId, CancellationToken ct)
    {
        await mediator.Send(new DeleteSetCommand(HttpContext.GetUserId(), setId), ct);
        return NoContent();
    }
}
