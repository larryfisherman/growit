namespace GrowIt.Contracts.Templates.Responses;

public record TemplateResponse(
    Guid Id,
    string Name,
    string? Notes,
    IReadOnlyList<TemplateExerciseResponse> Exercises);
