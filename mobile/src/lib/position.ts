/// Where the next row of an ordered list goes (a set in an exercise, an exercise in a
/// workout, a day in a plan). Not the count of rows: once one is deleted, the count lands
/// on a position that is still taken.
export const nextPosition = (rows: readonly { orderIndex: number }[]) =>
  rows.reduce((highest, row) => Math.max(highest, row.orderIndex + 1), 0);
