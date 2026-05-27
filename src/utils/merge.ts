/**
 * Merges data from all steps into a single object.
 * Currently supports flat merging, but can be extended for nested structures if needed.
 */
export function mergeStepData(allStepData: Record<number, any>): any {
  let merged = {};
  
  // Sort keys to ensure consistent merging order
  const sortedIndices = Object.keys(allStepData)
    .map(Number)
    .sort((a, b) => a - b);

  sortedIndices.forEach((index) => {
    merged = { ...merged, ...allStepData[index] };
  });

  return merged;
}
