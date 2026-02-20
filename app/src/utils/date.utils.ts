export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
