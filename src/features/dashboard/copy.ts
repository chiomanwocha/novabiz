export const dashboardCopy = {
  balanceLabel: 'Available balance',
  todayInflowLabel: "Today's money in",
  todayOutflowLabel: "Today's money out",
  loadingLabel: 'Loading your balance…',
  feedLoadingLabel: 'Loading your transactions…',
  feedEmptyTitle: 'No transactions yet',
  feedEmptyDescription: 'Money in and out will show up here.',
  feedLoadingMoreLabel: 'Loading more transactions…',
  insightsLoadingLabel: 'Loading your business insights…',
  /** What every masked figure shows when the hide-balance toggle is off — CLAUDE.md 6.7's
   * "status never shown by colour alone" spirit extends here: a fixed placeholder, not a blank,
   * so a masked amount still reads as "a number is hidden" rather than "this field is empty." */
  maskedFigure: '••••',
} as const
