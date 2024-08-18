/**
 * Calculates the range start and its end
 * @param page 
 * @param count has 5 as default value
 * @returns range start and end
 */
export default function pagination(page: number, count: number = 5) {
  const start  = (page - 1) * count;
  const end    = start + count - 1;

  return {
    start,
    end  
  }
}