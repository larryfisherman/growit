using GrowIt.API.Models;
using GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;
using GrowIt.Application.Workouts.Commands.CreateWorkout;
using GrowIt.Application.Workouts.Queries.GetWorkoutByDate;
using GrowIt.Application.Workouts.Queries.GetWorkoutById;
using GrowIt.Application.Workouts.Queries.GetWorkoutHistory;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateWorkout([FromBody] CreateWorkoutCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetHistory), new { userId = command.UserId }, new { id });
    }

    [HttpGet("{userId:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetWorkoutHistoryQuery(userId, page, pageSize), ct);
        return Ok(result);
    }
    
    [HttpGet("{workoutId:guid}")]
    public async Task<IActionResult> GetWorkoutById(Guid workoutId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetWorkoutByIdQuery(workoutId), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{userId:guid}/by-date")]
    public async Task<IActionResult> GetWorkoutByDate(Guid userId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var result = await mediator.Send(new GetWorkoutByDateQuery(userId, date), ct);
        return Ok(result);
    }

    [HttpPost("{workoutId:guid}/exercises")]
    public async Task<IActionResult> AddExerciseToWorkout(Guid workoutId, [FromBody] AddExerciseRequest request,
        CancellationToken ct)
    {
        var id = await mediator.Send(new AddExerciseToWorkoutCommand(workoutId, request.ExerciseId), ct);
        return Ok(id);
    }
}
