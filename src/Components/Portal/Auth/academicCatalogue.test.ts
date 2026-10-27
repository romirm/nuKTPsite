import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseAcademicCsv, searchAcademicPrograms, initialAcademicSelection, validAcademicSelection } from './academicCatalogue';
const majors = parseAcademicCsv(readFileSync(resolve('public/data/majors.csv'), 'utf8'));
const minors = parseAcademicCsv(readFileSync(resolve('public/data/minors.csv'), 'utf8'));

test('official catalogs keep major/minor distinctions, adjunct majors and quoted names with one CS label', () => {
  expect(majors).toHaveLength(88); expect(minors).toHaveLength(84);
  expect(majors.every(p => /major/i.test(p.option))).toBe(true);
  expect(minors.every(p => p.option === 'Minor')).toBe(true);
  expect(new Set(majors.map(p => p.name)).size).toBe(majors.length);
  expect(majors.map(p => p.name)).toEqual(expect.arrayContaining(['Computer Science', 'Russian Language, Literature, and Culture']));
  expect(majors.find(p => p.name === 'African Studies')?.option).toBe('Adjunct Major');
});

test('approved supplemental minors are searchable and selectable without changing the major catalogue', () => {
  for (const name of ['Data Engineering', 'Journalism', 'Jazz']) {
    expect(searchAcademicPrograms(minors, name).some(p => p.name === name)).toBe(true);
    expect(validAcademicSelection([name], minors)).toBe(true);
    expect(validAcademicSelection([name], majors)).toBe(name === 'Journalism');
    expect(minors.find(p => p.name === name)).toMatchObject({ option: 'Minor', school: '', url: '' });
  }
});
test('CSV handles quoted commas, escaped quotes and CRLF', () => {
  expect(parseAcademicCsv('name,option,school,url\r\n"A, ""B""",Major,WCAS,https://example.test\r\n')[0].name).toBe('A, "B"');
  expect(() => parseAcademicCsv('name,option,school,url\n"unfinished')).toThrow();
});
test('fuzzy queries and abbreviations return only official options', () => {
  expect(searchAcademicPrograms(majors, 'cs').map(p => p.name)).toEqual(['Computer Science']);
  expect(searchAcademicPrograms(majors, 'econmoics')[0].name).toBe('Economics');
  expect(searchAcademicPrograms(majors, 'computre scince').map(p => p.name)).toEqual(expect.arrayContaining(['Computer Science']));
  expect(searchAcademicPrograms(minors, 'cs').map(p => p.name)).toEqual(['Computer Science']);
  expect(searchAcademicPrograms(majors, 'invented discipline')).toEqual([]);
});
test('legacy ambiguous entries need confirmation while exact entries use official spelling', () => {
  expect(initialAcademicSelection(undefined, 'Computer Science', majors)).toEqual({ selected: ['Computer Science'], query: '' });
  expect(initialAcademicSelection(['Computer Science (BS)', 'Computer Science BA-CS'], '', majors)).toEqual({ selected: ['Computer Science'], query: '' });
  expect(initialAcademicSelection(['economics', 'Data Science'], 'CS', majors)).toEqual({ selected: ['Economics', 'Data Science'], query: '' });
  expect(initialAcademicSelection(undefined, 'CS + Math', majors).query).toBe('CS + Math');
});
test('required majors, optional minors, duplicate and wrong-kind protection', () => {
  expect(validAcademicSelection([], majors, true)).toBe(false);
  expect(validAcademicSelection([], minors)).toBe(true);
  expect(validAcademicSelection(['Economics', 'Data Science'], majors, true)).toBe(true);
  expect(validAcademicSelection(['Economics', 'Economics'], majors)).toBe(false);
  expect(validAcademicSelection(['Biomedical Engineering'], minors)).toBe(false);
  expect(validAcademicSelection(['CS'], majors)).toBe(false);
});
