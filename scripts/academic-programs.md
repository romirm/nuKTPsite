The profile editor loads `public/data/majors.csv` and `public/data/minors.csv`.
Source: https://admissions.northwestern.edu/academics/majors-minors/
Captured: October 13, 2026. The source contains 89 major options (including
adjunct majors) and 81 minor options. Certificates and other options are excluded.
The two Computer Science degree variants use one subject label, Computer Science,
giving 88 unique major labels. The CS minor uses the same subject label. Other
official labels, school codes, option types and departmental URLs are preserved.

The portal also allows three explicitly approved minor labels: Data Engineering,
Journalism, and Jazz. These supplement the 81 admissions-table minors, giving 84
allowed minors. Their school and URL are blank because they are portal additions,
not verified entries from the admissions table. The importer preserves them.

To refresh, download the official page to a local HTML file and run:

```sh
python scripts/import-academic-programs.py path/to/page.html
```

Profiles store canonical `majors` and `minors` arrays plus joined `major` and
`minor` strings for older consumers. Existing exact labels are preselected;
ambiguous or noncatalog entries require confirmation when the profile is edited.
Majors require at least one choice; minors are optional. Search drafts are never
saved as academic selections. Connections uses all declared majors and minors.
