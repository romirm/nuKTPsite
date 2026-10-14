import { selectDirectory, isAlumniProfile, graduationYear, alumniFacts } from './directoryModel';
test('directories are disjoint and use role rather than standing, preserving leadership/custom roles', () => {
  const profiles = { member: { name: 'Member', role: 'Member', year: 'Alumni' }, alumni: { name: 'Alum', role: ' alumni ' }, leader: { name: 'President', role: 'President' }, custom: { name: 'Steve', role: 'The Legend' }, hidden: { name: 'Hidden', role: 'Alumni', allowed: false }, unnamed: { role: 'Alumni' }, malformed: null };
  expect(Object.keys(selectDirectory(profiles, 'alumni'))).toEqual(['alumni']);
  expect(Object.keys(selectDirectory(profiles, 'members'))).toEqual(['member', 'leader', 'custom']);
  expect(isAlumniProfile({ role: { role: 'Alumni' } })).toBe(true);
});
test('graduation years are explicit, never guessed from standing', () => {
  expect(graduationYear({ graduation_year: 2024 })).toBe('2024');
  expect(graduationYear({ year: 'Class of 2025' })).toBe('2025');
  expect(graduationYear({ year: 'Senior' })).toBe('');
  expect(graduationYear({ year: 'Alumni' })).toBe('');
});
test('alumni facts show only requested fields and never treat past internships as current work', () => {
  expect(alumniFacts({ graduation_year: '2023', majors: ['Economics', 'Data Science'], workplace: 'Acme', internships: 'Old internship', about: 'Bio', email: 'private@example.test' })).toEqual({ 'Graduation year': '2023', Majors: 'Economics, Data Science', Workplace: 'Acme' });
  expect(alumniFacts({ internships: 'Former company' })['Workplace']).toBe('Not added');
});
