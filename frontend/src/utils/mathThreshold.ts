export const getTargetLatencyForFormula = (formula: string): number => {
  // Clean formula spacing
  const clean = formula.replace(/\s+/g, '');
  
  if (clean.includes('×') || clean.includes('x') || clean.includes('÷') || clean.includes('/')) {
    return 1800; // Recall-based operations should be quick (< 1.8s)
  }
  
  // Addition and subtraction threshold based on digit lengths (difficulty)
  const nums = clean.split(/[+−\-]/).map(s => parseInt(s)).filter(n => !isNaN(n));
  if (nums.length > 0) {
    const maxVal = Math.max(...nums);
    if (maxVal >= 100) {
      return 8000; // Hard: 3-digit operations (< 8.0s)
    }
    if (maxVal >= 20) {
      return 4500; // Medium: 2-digit operations (< 4.5s)
    }
    return 2200; // Easy: 1-digit operations (< 2.2s)
  }
  
  return 2000; // Default fallback
};
