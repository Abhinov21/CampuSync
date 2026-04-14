export const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

export const getAttendanceColor = (percentage) => {
  if (percentage >= 85) return '#10b981'; // green
  if (percentage >= 75) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};
