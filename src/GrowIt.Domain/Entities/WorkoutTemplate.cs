namespace GrowIt.Domain.Entities;

public class WorkoutTemplate
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<TemplateExercise> TemplateExercises { get; set; } = [];
}
