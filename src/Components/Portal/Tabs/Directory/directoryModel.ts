export type DirectoryPopulation = 'members' | 'alumni';
export function isAlumniProfile(profile: any): boolean {
  const role = typeof profile?.role === 'object' ? profile.role?.role : profile?.role;
  return typeof role === 'string' && role.trim().toLowerCase() === 'alumni';
}
export function selectDirectory(directory: Record<string, any>, population: DirectoryPopulation) {
  return Object.fromEntries(Object.entries(directory || {}).filter(([, profile]) => profile && typeof profile.name === 'string' && profile.name.trim() && profile.allowed !== false && isAlumniProfile(profile) === (population === 'alumni')));
}
export function graduationYear(profile: any): string {
  const value = profile?.graduation_year || profile?.year || '';
  const match = String(value).trim().match(/^(?:class of\s+)?(\d{4})$/i);
  return match ? match[1] : '';
}
export function profileMajors(profile: any): string {
  return Array.isArray(profile?.majors) ? profile.majors.filter((v: unknown) => typeof v === 'string').join(', ') : typeof profile?.major === 'string' ? profile.major : '';
}
export function alumniFacts(profile: any): Record<string, string> {
  return { 'Graduation year': graduationYear(profile) || 'Not added', 'Majors': profileMajors(profile) || 'Not added', 'Workplace': typeof profile?.workplace === 'string' && profile.workplace.trim() ? profile.workplace.trim() : 'Not added' };
}
