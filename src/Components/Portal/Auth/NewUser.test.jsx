import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import Swal from "sweetalert2";
import NewUser from "./NewUser";
import { loadAcademicCatalogues, parseAcademicCsv } from './academicCatalogue';
import { readFileSync } from 'fs';
import { resolve } from 'path';
jest.mock('./academicCatalogue', () => ({ ...jest.requireActual('./academicCatalogue'), loadAcademicCatalogues: jest.fn() }));
const catalogues = { majors: parseAcademicCsv(readFileSync(resolve('public/data/majors.csv'), 'utf8')), minors: parseAcademicCsv(readFileSync(resolve('public/data/minors.csv'), 'utf8')) };
import { get, update } from "../../../localPortal/database";
import { uploadBytes, getDownloadURL } from "../../../localPortal/storage";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
jest.mock("../../../localPortal/database", () => ({
  ref: (database, path) => ({ path }), child: (reference, path) => ({ path }),
  get: jest.fn(), update: jest.fn(),
}));
jest.mock("../../../localPortal/storage", () => ({
  ref: (storage, path) => ({ path }), uploadBytes: jest.fn(), getDownloadURL: jest.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const savedProfile = {
  name: "Test Member", email: "member@example.com", phone: "555-0100", year: "Junior",
  major: "Computer Science (BS)", majors: ["Computer Science (BS)"], minors: [], about: "I enjoy building projects with fellow members.",
  internships: "A software internship", resume_link: "https://example.test/resume.pdf",
  profile_pic_link: "https://example.test/photo.png",
  email_viewable: false, standing_viewable: false, internships_viewable: true,
  announcement_level: 2,
};
let container, root, editor;

beforeEach(() => {
  jest.clearAllMocks();
  loadAcademicCatalogues.mockResolvedValue(catalogues);
  Swal.fire.mockImplementation(() => new Promise(() => {}));
  update.mockResolvedValue(undefined);
  uploadBytes.mockResolvedValue({ ref: {} });
  getDownloadURL.mockResolvedValue("https://example.test/uploaded-file");
});
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  root = null;
});

async function mountEditor(profile, props = {}) {
  get.mockResolvedValue({ exists: () => true, val: () => profile });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const component = React.createRef();
  const firebase = { auth: () => ({ onAuthStateChanged: (callback) => {
    callback({ uid: "test-member" });
    return jest.fn();
  } }) };
  await act(async () => root.render(<NewUser ref={component} firebase={firebase} database={{}} storage={{}} newuser={false} {...props} />));
  editor = component.current;
}

async function submit() {
  await act(async () => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

test('alumni can edit graduation year and current workplace without inventing work from internships', async () => {
  await mountEditor({ ...savedProfile, role: 'Alumni', year: 'Alumni', about: '', resume_link: '', profile_pic_link: '', minor: 'Historic minor', minors: undefined, graduation_year: '2024', workplace: 'Previous employer', leetcode: { username: 'member-code' } }, { alumni: true });
  expect(document.getElementById('year')).toBeNull();
  expect(document.getElementById('internships')).toBeNull();
  expect(document.getElementById('about')).toBeNull();
  expect(document.getElementById('email-address')).toBeNull();
  expect(document.getElementById('phone-number')).toBeNull();
  expect(document.getElementById('minor')).toBeNull();
  expect(document.getElementById('leetcode')).toBeNull();
  expect(document.getElementById('file-upload3')).toBeNull();
  expect(document.getElementById('graduation-year').value).toBe('2024');
  document.getElementById('workplace').value = 'Current employer';
  await submit();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update.mock.calls[0][1]).toMatchObject({ graduation_year: '2024', workplace: 'Current employer', year: 'Alumni', internships: savedProfile.internships, 'leetcode/username': 'member-code' });
  expect(update.mock.calls[1][1]).toMatchObject({ graduation_year: '2024', workplace: 'Current employer' });
  expect(update.mock.calls[0][1]).not.toHaveProperty('minor');
  expect(update.mock.calls[0][1]).not.toHaveProperty('minors');
});

function search(id, text) {
  const input = document.getElementById(id);
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

test('multiple confirmed majors and minors save as canonical arrays; draft text cannot save', async () => {
  await mountEditor(savedProfile);
  search('major', 'econmoics');
  await submit();
  expect(update).not.toHaveBeenCalled();
  act(() => container.querySelector('#major-options [role=option]').click());
  search('minor', 'data science');
  act(() => container.querySelector('#minor-options [role=option]').click());
  search('minor', 'psych');
  act(() => container.querySelector('#minor-options [role=option]').click());
  await submit();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update.mock.calls[0][1]).toMatchObject({ majors: ['Computer Science (BS)', 'Economics'], minors: ['Data Science', 'Psychology'], major: 'Computer Science (BS), Economics', minor: 'Data Science, Psychology' });
  expect(update.mock.calls[1][1].majors).toEqual(update.mock.calls[0][1].majors);
});

test('missing required major and unconfirmed legacy majors cannot save', async () => {
  await mountEditor({ ...savedProfile, majors: undefined, major: 'CS' });
  expect(editor.state.majors).toEqual([]);
  expect(document.getElementById('major').value).toBe('CS');
  await submit();
  expect(update).not.toHaveBeenCalled();
  search('major', 'Economics');
  act(() => container.querySelector('#major-options [role=option]').click());
  act(() => container.querySelector('[aria-label="Remove Economics major"]').click());
  await submit();
  expect(update).not.toHaveBeenCalled();
});

test('keyboard selection works and unmatched optional minor text blocks saving', async () => {
  await mountEditor(savedProfile);
  search('minor', 'econ');
  act(() => document.getElementById('minor').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
  expect(editor.state.minors).toEqual(['Economics']);
  search('minor', 'Not a real minor');
  await submit();
  expect(update).not.toHaveBeenCalled();
  search('minor', '');
  await submit();
  expect(update).toHaveBeenCalledTimes(2);
});

test('catalog load failures block saving and offer a retry', async () => {
  loadAcademicCatalogues.mockRejectedValueOnce(new Error('offline'));
  await mountEditor(savedProfile);
  expect(container.querySelector('[role=alert]').textContent).toContain('Try again');
  expect(container.querySelector('button[type=submit]').disabled).toBe(true);
  await submit();
  expect(update).not.toHaveBeenCalled();
  await act(async () => container.querySelector('[role=alert] button').click());
  expect(editor.state.majors).toEqual(['Computer Science (BS)']);
});

test("required fields are marked and the Settings section is removed", async () => {
  await mountEditor(savedProfile);
  expect(container.querySelectorAll(".portal-required-mark")).toHaveLength(8);
  for (const id of ["last-name", "email-address", "phone-number", "year"]) {
    expect(document.getElementById(id).required).toBe(true);
  }
  expect(document.getElementById('major').getAttribute('aria-required')).toBe('true');
  expect([...document.getElementById('year').options].map(option => option.value)).not.toContain('Alumni');
  expect(document.getElementById("file-upload3").getAttribute("aria-required")).toBe("true");
  expect(document.getElementById("file-upload2").getAttribute("aria-required")).toBe("true");
  expect(container.textContent).not.toContain("Settings");
  expect(container.querySelectorAll("input[type=checkbox]")).toHaveLength(0);
});

test("missing personal fields, invalid email, and whitespace names cannot be saved", async () => {
  await mountEditor(savedProfile);
  for (const id of ["last-name", "email-address", "phone-number", "year"]) {
    const field = document.getElementById(id);
    const original = field.value;
    field.value = "";
    await submit();
    expect(update).not.toHaveBeenCalled();
    field.value = original;
  }
  document.getElementById("email-address").value = "invalid-email";
  await submit();
  expect(update).not.toHaveBeenCalled();
  document.getElementById("email-address").value = savedProfile.email;
  document.getElementById("last-name").value = "   ";
  await submit();
  expect(update).not.toHaveBeenCalled();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Name form not filled" }));
});

test("banner is absent from editing and changing majors preserves its existing assignment", async () => {
  await mountEditor(savedProfile);
  expect(container.querySelector("[data-banner-activity]")).toBeNull();
  expect(container.querySelectorAll("input[type=file]")).toHaveLength(2);
  expect(container.textContent).not.toContain("Cover photo");
  const major = document.getElementById("major");
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  act(() => {
    setValue.call(major, "Mechanical Engineering");
    major.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(container.querySelector("[data-banner-activity]")).toBeNull();
  act(() => container.querySelector('[role=option]').click());
  act(() => container.querySelector('[aria-label="Remove Computer Science (BS) major"]').click());
  expect(container.querySelector("[data-banner-activity]")).toBeNull();
  expect(update).not.toHaveBeenCalled();
  expect(uploadBytes).not.toHaveBeenCalled();
  await submit();
  expect(update.mock.calls[0][1]).toMatchObject({ major: 'Mechanical Engineering', banner_activity: 'software' });
  expect(update.mock.calls[1][1]).toMatchObject({ major: 'Mechanical Engineering', banner_activity: 'software' });
});

test('a stored banner assignment takes precedence over the major on save', async () => {
  await mountEditor({ ...savedProfile, banner_activity: 'physics' });
  await submit();
  expect(update.mock.calls[0][1].banner_activity).toBe('physics');
  expect(update.mock.calls[1][1].banner_activity).toBe('physics');
});

test('existing resume is visible in the editor with an open link and replacement control', async () => {
  await mountEditor({ ...savedProfile, resume_filename: 'Member Resume.pdf' });
  expect(container.querySelector('iframe[title="Uploaded resume"]').getAttribute('src')).toBe(savedProfile.resume_link);
  expect(container.querySelector('a.profile-edit-resume').getAttribute('href')).toBe(savedProfile.resume_link);
  expect(container.textContent).toContain('Member Resume.pdf');
  expect(container.textContent).toContain('Replace resume');
});

test("an existing member without a saved resume must upload one", async () => {
  await mountEditor({ ...savedProfile, resume_link: "" });
  await submit();
  expect(update).not.toHaveBeenCalled();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "All members are required to upload a resume" }));
});

test("a saved resume does not bypass the required photo", async () => {
  await mountEditor({ ...savedProfile, profile_pic_link: "" });
  await submit();
  expect(update).not.toHaveBeenCalled();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "All members are required to have a profile photo" }));
});

test("existing attachments satisfy validation and removed Settings preserve visibility preferences", async () => {
  await mountEditor(savedProfile);
  await submit();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenCalledWith({ path: "users/test-member" }, expect.objectContaining({
    email: savedProfile.email, phone: savedProfile.phone, announcement_level: 2,
    email_viewable: false, standing_viewable: false, internships_viewable: true,
  }));
  expect(update).toHaveBeenCalledWith({ path: "public_users/test-member" }, expect.objectContaining({
    email: "", year: "", internships: savedProfile.internships,
  }));
});

test("failed or invalid uploads do not satisfy required attachments; successful saved uploads do", async () => {
  await mountEditor({ ...savedProfile, resume_link: "", profile_pic_link: "" });
  const resume = { files: [new File(["test"], "member.resume.PDF", { type: "application/pdf" })], value: "selected" };
  uploadBytes.mockRejectedValueOnce(new Error("Upload failed"));
  await act(async () => editor.uploadRequiredAttachment("resume", resume));
  expect(editor.resumeAdded).toBe(false);
  expect(update).not.toHaveBeenCalled();
  await act(async () => editor.uploadRequiredAttachment("photo", { files: [new File(["test"], "photo.txt")], value: "selected" }));
  expect(editor.photoAdded).toBe(false);
  await act(async () => editor.uploadRequiredAttachment("resume", resume));
  await act(async () => editor.uploadRequiredAttachment("photo", { files: [new File(["test"], "photo.png", { type: "image/png" })], value: "selected" }));
  expect(editor.resumeAdded).toBe(true);
  expect(container.querySelector('iframe[title="Uploaded resume"]').getAttribute('src')).toBe('https://example.test/uploaded-file');
  expect(container.textContent).toContain('member.resume.PDF');
  expect(update).toHaveBeenCalledWith({ path: 'users/test-member' }, expect.objectContaining({ resume_filename: 'member.resume.PDF' }));
  expect(editor.photoAdded).toBe(true);
  expect(update).toHaveBeenCalledWith({ path: "public_users/test-member" }, expect.objectContaining({
    profile_pic_link: "https://example.test/uploaded-file", pfp_thumb_link: "", pfp_large_link: "",
  }));
  update.mockClear();
  await submit();
  expect(update).toHaveBeenCalledTimes(2);
});
