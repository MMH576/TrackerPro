/**
 * Formats milliseconds into a human-readable MM:SS format
 * @param ms Milliseconds to format
 * @returns Formatted time string (MM:SS)
 */
export function formatTime(ms: number): string {
  if (!ms || ms < 0) return '0:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into a human-readable MM:SS format
 * @param seconds Seconds to format
 * @returns Formatted time string (MM:SS)
 */
export function formatSeconds(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parses a time string (MM:SS) into milliseconds
 * @param timeString Time string in MM:SS format
 * @returns Milliseconds
 */
export function parseTimeToMs(timeString: string): number {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
} 