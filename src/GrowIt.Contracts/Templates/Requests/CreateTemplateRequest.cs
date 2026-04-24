namespace GrowIt.Contracts.Templates.Requests;

public record CreateTemplateRequest(Guid UserId, string Name, string? Notes);
