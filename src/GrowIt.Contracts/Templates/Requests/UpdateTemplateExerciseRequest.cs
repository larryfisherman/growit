namespace GrowIt.Contracts.Templates.Requests;

public record UpdateTemplateExerciseRequest(
    int TargetSets,
    int TargetReps,
    int RestSeconds,
    int OrderIndex);
