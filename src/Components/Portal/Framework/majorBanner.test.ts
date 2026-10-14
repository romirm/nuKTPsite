import { majorBannerActivity } from "./majorBanner";

test.each([
  ["Computer Science", "software"], ["ComputerScience", "software"],
  ["Mathematics and Computer Science", "software"], ["Econ/CS", "software"],
  ["Data Science, CS, and Jazz", "software"], ["Electrical + CS", "software"],
  ["C.S.", "software"], ["  DATA SCIENCE, BIP minor  ", "data"],
  ["Statistics", "data"], ["IEMS", "data"], ["Industrial Engineering", "data"],
  ["Mechanical Engineering/Data Science", "mechanical"], ["Mechanical Engineer", "mechanical"],
  ["Mech E", "mechanical"], ["MaDE", "mechanical"], ["Aerospace Engineering", "mechanical"],
  ["Computer Engineering", "electrical"], ["ECE", "electrical"],
  ["Chemical Engineering", "chemical"], ["Materials Science and Engineering", "chemical"],
  ["Biomedical Engineering", "biotech"], ["Biological Sciences", "biotech"],
  ["Neuroscience/Computation and Systems Modeling/Legal Studies", "neuroscience"],
  ["Psychology", "neuroscience"], ["Physics", "physics"],
  ["MMSS and Mathematics", "quant"], ["Economics", "quant"],
  ["Graphic Design", "design"], ["Architecture", "design"],
  ["History", "reading"], ["Sophomore", "reading"],
])("%s selects the %s ninja", (major, expected) => {
  expect(majorBannerActivity(major)).toBe(expected);
});

test("missing and malformed majors use the general scene", () => {
  ["", "  ", undefined, null, 42, {}, ["Computer Science"]].forEach(major => {
    expect(majorBannerActivity(major)).toBe("reading");
  });
});
