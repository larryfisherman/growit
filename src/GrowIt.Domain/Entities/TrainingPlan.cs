namespace GrowIt.Domain.Entities;

/// A named programme, e.g. "Push/Pull 4 days". Groups the days it is made of.
/// One plan is meant to be active and drives the suggestion on the today screen. The
/// database does not enforce this (two racing first-plan creates can both be active).
/// GetNextPlanDayQueryHandler takes the oldest active one; GetTrainingPlans reports each
/// plan's flag as stored.
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
