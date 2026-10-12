export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0) {
    return `${months} months`;
  }
  
  return `${years} years, ${months} months`;
}

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem('sound_enabled') !== 'false';
  } catch {
    return true;
  }
}
