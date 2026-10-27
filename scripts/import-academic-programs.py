"""Extract the admissions table into the two runtime CSV catalogues, using stdlib only."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
import csv
import json
import sys

SOURCE = "https://admissions.northwestern.edu/academics/majors-minors/"
ROOT = Path(__file__).resolve().parents[1]

class Node:
    def __init__(self, tag="", attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []
    def descendants(self, tag=None, class_name=None):
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (class_name is None or class_name in child.attrs.get("class", "").split()):
                    yield child
                yield from child.descendants(tag, class_name)
    def text(self):
        return " ".join("".join(c.text() if isinstance(c, Node) else c for c in self.children).split())

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node(); self.stack = [self.root]
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs); self.stack[-1].children.append(node)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]; break
    def handle_data(self, data):
        self.stack[-1].children.append(data)

parser = Parser()
parser.feed(Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / ".local-portal/northwestern-programs.html").read_text(encoding="utf-8-sig"))
catalogues = {"majors": {}, "minors": {}}
excluded = []
for row in parser.root.descendants("tr"):
    program = next(row.descendants(class_name="program"), None)
    options = next(row.descendants(class_name="options"), None)
    if program is None or options is None: continue
    name = program.text()
    cells = list(row.descendants("td"))
    school = cells[-1].text()
    for anchor in options.descendants("a"):
        text = anchor.text()
        option = text[len(name):].strip() if text.startswith(name) else text
        kind = "majors" if "major" in option.lower() else "minors" if option.lower() == "minor" else None
        if kind is None: excluded.append({"name": name, "option": option}); continue
        canonical_name = "Computer Science" if name in {"Computer Science (BS)", "Computer Science BA-CS"} else name
        record = {"name": canonical_name, "option": option, "school": school, "url": urljoin(SOURCE, anchor.attrs["href"])}
        if canonical_name in catalogues[kind] and catalogues[kind][canonical_name] != record: raise ValueError(f"Ambiguous duplicate: {canonical_name}")
        catalogues[kind][canonical_name] = record
# Explicitly approved portal additions; these are not attributed to the admissions table.
for name in ("Data Engineering", "Journalism", "Jazz"):
    catalogues["minors"].setdefault(name, {"name": name, "option": "Minor", "school": "", "url": ""})
output = ROOT / "public/data"
output.mkdir(parents=True, exist_ok=True)
for kind, values in catalogues.items():
    if not values: raise ValueError(f"No {kind} extracted")
    with (output / f"{kind}.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["name", "option", "school", "url"])
        writer.writeheader(); writer.writerows(sorted(values.values(), key=lambda r: r["name"].casefold()))
print(json.dumps({"source": SOURCE, "majors": len(catalogues["majors"]), "minors": len(catalogues["minors"]), "excluded_other_options": len(excluded)}, indent=2))
