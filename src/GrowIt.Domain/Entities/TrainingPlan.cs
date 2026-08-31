namespace GrowIt.Domain.Entities;

/// A named programme, e.g. "PUSH/PULL 4 dni". Groups the days it is made of.
/// One plan per user is active at a time and drives the suggestion on the today screen.
public class TrainingPlan
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<TrainingPlanDay> Days { get; set; } = [];
}
