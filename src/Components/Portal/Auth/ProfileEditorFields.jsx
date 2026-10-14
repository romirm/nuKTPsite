import React from 'react';
import AcademicSelector from './AcademicSelector';
import './ProfileEditorFields.css';

function RequiredMark() { return <span className="portal-required-mark" aria-hidden="true"> *</span>; }
function Field({ id, label, required = false, ...props }) {
  return <div className="profile-edit-field"><label htmlFor={id}>{label}{required && <RequiredMark />}</label><input id={id} name={id} required={required} {...props} /></div>;
}

export default function ProfileEditorFields({ editor }) {
  const { state, props } = editor;
  const busy = !state.profileReady || state.uploading;
  return <form className="portal-profile-form profile-edit" ref={editor.profileForm} onSubmit={editor.submitProfile}>
    <section className="profile-edit-card" aria-labelledby="profile-details-title">
      <h2 id="profile-details-title">Personal details</h2>
      <div className="profile-edit-grid">
        <Field id="last-name" label="Name" required type="text" autoComplete="name" defaultValue={props.dn || ''} />
        {!props.alumni && <Field id="email-address" label="Email" required type="email" autoComplete="email" />}
        {!props.alumni && <Field id="phone-number" label="Phone" required type="tel" autoComplete="tel" />}
        {props.alumni ? <Field id="graduation-year" label="Graduation year" type="number" min="1900" max={new Date().getFullYear() + 10} step="1" placeholder="YYYY" /> : <div className="profile-edit-field"><label htmlFor="year">Year<RequiredMark /></label><select id="year" name="year" required defaultValue="">
          <option value="" disabled>Select year</option>{['Freshman', 'Sophomore', 'Junior', 'Senior'].map(year => <option key={year}>{year}</option>)}
        </select></div>}
        <div className="profile-edit-wide"><AcademicSelector id="major" label="Major(s)" required options={state.catalogues?.majors || []} disabled={!state.catalogues || !state.profileReady} selected={state.majors} query={state.majorQuery} onQueryChange={majorQuery => editor.setState({ majorQuery })} onChange={majors => editor.setState({ majors })} /></div>
        {!props.alumni && <div className="profile-edit-wide"><AcademicSelector id="minor" label="Minor(s)" options={state.catalogues?.minors || []} disabled={!state.catalogues || !state.profileReady} selected={state.minors} query={state.minorQuery} onQueryChange={minorQuery => editor.setState({ minorQuery })} onChange={minors => editor.setState({ minors })} /></div>}
      </div>
      {state.catalogueError && <p className="profile-edit-error" role="alert">Could not load academic options. <button type="button" onClick={editor.loadAcademics}>Try again</button></p>}
    </section>

    <section className="profile-edit-card" aria-labelledby="profile-about-title">
      <h2 id="profile-about-title">Profile</h2>
      {!props.alumni && <div className="profile-edit-field"><label htmlFor="about">About<RequiredMark /></label><textarea id="about" name="about" rows={4} required minLength={20} placeholder="A little about you" aria-describedby="about-help" defaultValue="" /><p id="about-help" className="profile-edit-note">At least 20 characters.</p></div>}
      <div className="profile-edit-grid profile-edit-socials">
        {props.alumni ? <Field id="workplace" label="Workplace" type="text" placeholder="Company or organization" /> : <Field id="internships" label="Internships" type="text" />}
        <Field id="instagram" label="Instagram" type="text" placeholder="Username" autoCapitalize="none" />
        <Field id="linkedin" label="LinkedIn" type="text" placeholder="Username" autoCapitalize="none" />
        {!props.alumni && <div><Field id="leetcode" label="LeetCode" type="text" placeholder="Username" autoCapitalize="none" />{state.existingLC && <p className="profile-edit-note">Changing your username resets progress.</p>}</div>}
      </div>
    </section>

    <section className="profile-edit-card" aria-labelledby="profile-photo-title">
      <h2 id="profile-photo-title">{props.alumni ? "Photo" : "Photo & resume"}</h2>
      <div className="profile-edit-grid profile-edit-attachments">
        <div className="profile-edit-field"><label htmlFor="file-upload2">Photo{!props.alumni && <RequiredMark />}</label><div className="profile-edit-upload-row"><img id="profPicImg" alt="Profile" className="profile-edit-photo" /><label htmlFor="file-upload2" className="profile-edit-upload">Upload photo<input onChange={e => editor.uploadRequiredAttachment('photo', e.target)} aria-label="Photo" aria-required={!props.alumni} accept=".jpg,.jpeg,.png,image/jpeg,image/png" disabled={busy} id="file-upload2" name="file-upload2" type="file" className="sr-only" /></label></div></div>
        {!props.alumni && <div className="profile-edit-field"><label htmlFor="file-upload3">Resume{!props.alumni && <RequiredMark />}</label><div className="profile-edit-upload-row"><label htmlFor="file-upload3" className="profile-edit-upload">{state.resumeLink ? 'Replace resume' : 'Upload resume'}<input onChange={e => editor.uploadRequiredAttachment('resume', e.target)} aria-label="Resume" aria-required={!props.alumni} accept=".pdf,application/pdf" disabled={busy} id="file-upload3" name="file-upload3" type="file" className="sr-only" /></label></div><p className="profile-edit-note">{state.resumeLink ? state.resumeFilename || 'Resume uploaded' : 'No resume uploaded.'}</p></div>}
      </div>
      {!props.alumni && state.resumeLink && <div className="profile-edit-resume-preview"><div className="profile-edit-resume-heading"><span className="profile-edit-label">Current resume</span><a className="profile-edit-resume" href={state.resumeLink} target="_blank" rel="noreferrer">Open PDF ↗</a></div><iframe key={state.resumeLink} src={state.resumeLink} title="Uploaded resume" loading="lazy" /><p className="profile-edit-note">If the preview doesn’t load, use Open PDF.</p></div>}
    </section>
    <div className="profile-edit-actions"><button type="submit" disabled={busy || !state.catalogues} className="hidden profile-edit-save" ref={editor.submitButton}>{state.uploading ? 'Uploading…' : props.newuser ? 'Create my account' : 'Save changes'}</button></div>
  </form>;
}
