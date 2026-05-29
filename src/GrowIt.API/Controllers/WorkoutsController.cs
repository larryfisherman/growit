using GrowIt.API.Authorization;
using GrowIt.Application.Workouts.Commands.AddExerciseToWorkout;
using GrowIt.Application.Workouts.Commands.CreateWorkout;
using GrowIt.Application.Workouts.Commands.CreateWorkoutFromTemplate;
using GrowIt.Application.Workouts.Queries.GetWorkoutByDate;
using GrowIt.Application.Workouts.Queries.GetWorkoutById;
using GrowIt.Application.Workouts.Queries.GetWorkoutHistory;
using GrowIt.Application.Workouts.Queries.GetWorkoutsByMonth;
using GrowIt.Contracts.Workouts.Requests;
using GrowIt.Contracts.Workouts.Responses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrowIt.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class WorkoutsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateWorkoutResponse>> CreateWorkout(
        [FromBody] CreateWorkoutRequest request, CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        var id = await mediator.Send(new CreateWorkoutCommand(
            userId, request.Name, request.PerformedAt, request.Notes), ct);
        return Ok(new CreateWorkoutResponse(id));
    }

    [HttpGet("{userId:guid}/history")]
    public async Task<ActionResult<WorkoutHistoryResponse>> GetHistory(
        Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var authenticatedUserId = HttpContext.GetUserId();
        var result = await mediator.Send(new GetWorkoutHistoryQuery(authenticatedUserId, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{workoutId:guid}")]
    public async Task<ActionResult<WorkoutResponse>> GetWorkoutById(Guid workoutId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetWorkoutByIdQuery(workoutId), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{userId:guid}/by-date")]
    public async Task<ActionResult<WorkoutByDateResponse>> GetWorkoutByDate(
        Guid userId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var authenticatedUserId = HttpContext.GetUserId();
        var result = await mediator.Send(new GetWorkoutByDateQuery(authenticatedUserId, date), ct);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{userId:guid}/by-month")]
    public async Task<ActionResult<List<WorkoutSummaryResponse>>> GetWorkoutsByMonth(
        Guid userId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var authenticatedUserId = HttpContext.GetUserId();
        var result = await mediator.Send(new GetWorkoutsByMonthQuery(authenticatedUserId, year, month), ct);
        return Ok(result);
    }

    [HttpPost("{workoutId:guid}/exercises")]
    public async Task<ActionResult<AddExerciseToWorkoutResponse>> AddExerciseToWorkout(
        Guid workoutId, [FromBody] AddExerciseToWorkoutRequest request, CancellationToken ct)
    {
        var id = await mediator.Send(new AddExerciseToWorkoutCommand(workoutId, request.ExerciseId), ct);
        return Ok(new AddExerciseToWorkoutResponse(id));
    }

    [HttpPost("from-template")]
    public async Task<ActionResult<CreateWorkoutFromTemplateResponse>> CreateFromTemplate(
        [FromBody] CreateWorkoutFromTemplateRequest request, CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        var id = await mediator.Send(new CreateWorkoutFromTemplateCommand(
            userId, request.TemplateId, request.PerformedAt), ct);
        return Ok(new CreateWorkoutFromTemplateResponse(id));
    }
}
