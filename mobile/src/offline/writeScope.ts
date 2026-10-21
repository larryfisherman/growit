/// Every write in the app shares one scope, which is what makes the mutation cache run
/// them strictly in order: canRun() only lets the first pending mutation of a scope
/// through, and a paused one still counts as pending. So a queue drained after a flight
/// lands create-then-child rather than all at once, and nothing arrives before the row
/// it depends on.
///
/// Splitting this per aggregate was tempting and wrong: "add a plan day offline, then
/// start a workout from it" crosses aggregates, and separate scopes would race.
///
/// In a module of its own because more than the client needs to know which mutations
/// are the queue: the lost-write banner and the deferred refetch both ask.
export const WRITE_SCOPE = { id: 'growit-writes' };
