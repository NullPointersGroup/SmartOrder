import xml.etree.ElementTree as ET
import ast
from pathlib import Path
from typing import List, Dict, Set, TypedDict, Optional, Literal
import json
import re
from dataclasses import dataclass

# --- Totale requisiti per categoria ---
TOT_OBBLIG: int = 110
TOT_DESID: int = 146
TOT_OPZ: int = 17

_CATEGORY_TOTALS: Dict[str, int] = {
    "obblig": TOT_OBBLIG,
    "desid":  TOT_DESID,
    "opz":    TOT_OPZ,
}

_TS_EXTENSIONS = (".ts", ".tsx")

# --- TypedDict per le funzioni ---
class FuncInfo(TypedDict):
    name: str
    start: int
    end: int
    reqs: List[str]

# --- Parsing funzioni/metodi Python ---

def _parse_req_tags(docstring: Optional[str]) -> List[str]:
    """Estrae i tag @req da una docstring."""
    if not docstring:
        return []
    return [
        line.split()[1]
        for line in docstring.splitlines()
        if line.strip().startswith("@req")
    ]


def _build_func_name(node_name: str, class_path: str) -> str:
    return f"{class_path}.{node_name}" if class_path else node_name


def _collect_nodes(
    body: List[ast.stmt],
    class_path: str = "",
) -> List[FuncInfo]:
    """
    Visita ricorsivamente il body di un modulo o di una classe,
    raccogliendo FuncInfo per ogni FunctionDef trovata.
    """
    results: List[FuncInfo] = []

    for node in body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            results.append(
                FuncInfo(
                    name=_build_func_name(node.name, class_path),
                    start=node.lineno,
                    end=node.end_lineno or node.lineno,
                    reqs=_parse_req_tags(ast.get_docstring(node)),
                )
            )
        elif isinstance(node, ast.ClassDef):
            nested_path = _build_func_name(node.name, class_path)
            results.extend(_collect_nodes(node.body, class_path=nested_path))

    return results


def extract_funcs_and_reqs_py(file_path: Path) -> List[FuncInfo]:
    try:
        content = file_path.read_text(encoding="utf-8")
        if not content.strip():
            return []
        tree = ast.parse(content, filename=str(file_path))
    except (SyntaxError, UnicodeDecodeError) as e:
        print(f"Warning: Could not parse {file_path}: {e}")
        return []

    return _collect_nodes(tree.body)

# --- Parsing funzioni JS/TS con @req ---
def extract_funcs_and_reqs_js(file_path: Path) -> List[FuncInfo]:
    funcs: List[FuncInfo] = []
    try:
        lines = file_path.read_text(encoding="utf-8").splitlines()
    except Exception as e:
        print(f"Warning: Cannot read {file_path}: {e}")
        return funcs

    reqs: List[str] = []
    func_start = None
    func_name = None

    for i, line in enumerate(lines, start=1):
        req_match = re.search(r"@req\s+(\S+)", line)
        if req_match:
            reqs.append(req_match.group(1))

        func_match = re.match(
            r"\s*(export\s+(default\s+)?)?(function|const|let|var)\s+(\w+)", line
        )
        if func_match:
            if func_start is not None:
                funcs.append(FuncInfo(name=str(func_name), start=func_start, end=i-1, reqs=reqs))
                reqs = []
            func_start = i
            func_name = func_match.group(4)  # FIX: was group(3), should be group(4) for the name
    if func_start is not None:
        funcs.append(FuncInfo(name=str(func_name), start=func_start, end=len(lines), reqs=reqs))
    return funcs

# --- Parsing coverage.xml Python ---

def _parse_covered_lines(cls: ET.Element) -> Set[int]:
    """Restituisce i numeri di riga con hits > 0 per un elemento <class>."""
    return {
        int(number)
        for line in cls.findall("lines/line")
        if (number := line.get("number")) is not None
        and (hits := line.get("hits")) is not None
        and int(hits) > 0
    }


def _parse_coverage_classes(root: ET.Element) -> Dict[str, Set[int]]:
    """Aggrega le righe coperte per file, visitando tutti gli elementi <class>."""
    file_coverage: Dict[str, Set[int]] = {}

    for cls in root.findall(".//class"):
        filename_raw = cls.get("filename")
        if not filename_raw:
            continue

        rel_filename = Path(filename_raw).as_posix()
        covered_lines = _parse_covered_lines(cls)
        file_coverage.setdefault(rel_filename, set()).update(covered_lines)

    return file_coverage


def parse_coverage_xml(coverage_xml_path: Path) -> Dict[str, Set[int]]:
    try:
        root = ET.parse(coverage_xml_path).getroot()
    except (ET.ParseError, FileNotFoundError) as e:
        print(f"Warning: Could not parse {coverage_xml_path}: {e}")
        return {}

    return _parse_coverage_classes(root)

# --- Parsing lcov.info JS/TS ---
def parse_lcov_info(lcov_path: Path, proj_root: Path) -> Dict[str, Set[int]]:
    coverage: Dict[str, Set[int]] = {}
    if not lcov_path.exists():
        return coverage

    current_file: Optional[Path] = None
    lines_covered: Set[int] = set()

    for line in lcov_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("SF:"):
            current_file = Path(line[3:]).resolve()
            lines_covered = set()
        elif line.startswith("DA:"):
            parts = line[3:].split(",")
            if len(parts) == 2 and int(parts[1]) > 0:
                lines_covered.add(int(parts[0]))
        elif line.startswith("end_of_record") and current_file is not None:
            try:
                # FIX: relative to proj_root (e.g. "frontend/") → "src/Counter.tsx"
                rel_file = current_file.relative_to(proj_root).as_posix()
            except ValueError:
                rel_file = current_file.name
            coverage[rel_file] = lines_covered
    return coverage

# --- Classifica requisiti ---
def categorize_req(req_id: str) -> str:
    try:
        priority = req_id.split("-")[1].split("_")[0]
        if priority == "OB":
            return "obblig"
        elif priority == "DE":
            return "desid"
        elif priority == "OP":
            return "opz"
    except IndexError:
        pass
    return "unknown"

# --- Genera JSON Sonar ---

def _file_prefix(file_rel: str) -> str:
    return "frontend" if file_rel.endswith(_TS_EXTENSIONS) else "backend"


def _engine_id(file_rel: str) -> str:
    return "vitest" if file_rel.endswith(_TS_EXTENSIONS) else "backend-py"


def _build_issue(file_rel: str, func: FuncInfo, req: str) -> Dict:
    return {
        "engineId": _engine_id(file_rel),
        "ruleId": req,
        "severity": "BLOCKER",
        "type": "CODE_SMELL",
        "primaryLocation": {
            "message": f"Requisito {req} NON soddisfatto",
            "filePath": f"{_file_prefix(file_rel)}/{file_rel}",
            "textRange": {"startLine": func["start"], "endLine": func["end"]},
        },
    }


def _count_by_cat(reqs: Set[str]) -> Dict[str, int]:
    """Conta i requisiti per categoria e aggiunge il totale globale."""
    counts = {cat: sum(1 for r in reqs if categorize_req(r) == cat) for cat in _CATEGORY_TOTALS}
    counts["globale"] = len(reqs)
    return counts


def _coverage_pct(cat: str, covered_by_cat: Dict[str, int]) -> float:
    total = _CATEGORY_TOTALS.get(cat, 0)
    return round(covered_by_cat[cat] / total * 100, 1) if total else 0.0


def _build_summary(all_reqs: Set[str], covered_reqs: Set[str]) -> Dict:
    uncovered_reqs = all_reqs - covered_reqs
    covered_by_cat   = _count_by_cat(covered_reqs)
    uncovered_by_cat = _count_by_cat(uncovered_reqs)

    return {
        "totale_requisiti": {
            "obbligatori": TOT_OBBLIG,
            "desiderabili": TOT_DESID,
            "opzionali":   TOT_OPZ,
            "globale":     TOT_OBBLIG + TOT_DESID + TOT_OPZ,
        },
        "coperti": {
            "obbligatori": covered_by_cat["obblig"],
            "desiderabili": covered_by_cat["desid"],
            "opzionali":   covered_by_cat["opz"],
            "globale":     covered_by_cat["globale"],
        },
        "non_coperti": {
            "obbligatori": uncovered_by_cat["obblig"],
            "desiderabili": uncovered_by_cat["desid"],
            "opzionali":   uncovered_by_cat["opz"],
            "globale":     uncovered_by_cat["globale"],
        },
        "per_categoria": {
            "obbligatori": _coverage_pct("obblig", covered_by_cat),
            "desiderabili": _coverage_pct("desid", covered_by_cat),
            "opzionali":   _coverage_pct("opz",   covered_by_cat),
        },
    }


def _collect_issues_and_reqs(
    func_map: Dict[str, List[FuncInfo]],
    coverage_map: Dict[str, Set[int]],
) -> tuple[List[Dict], Set[str], Set[str]]:
    issues: List[Dict] = []
    all_reqs: Set[str] = set()
    uncovered_reqs: Set[str] = set()

    for file_rel, funcs in func_map.items():
        covered_lines = coverage_map.get(file_rel, set())
        for func in funcs:
            is_covered = any(line in covered_lines for line in range(func["start"] + 1, func["end"] + 1))
            for req in func["reqs"]:
                all_reqs.add(req)
                if not is_covered:
                    uncovered_reqs.add(req)
                    issues.append(_build_issue(file_rel, func, req))

    covered_reqs = all_reqs - uncovered_reqs
    return issues, all_reqs, covered_reqs


def generate_sonar_issues(
    func_map: Dict[str, List[FuncInfo]],
    coverage_map: Dict[str, Set[int]],
    output_path: Path,
) -> None:
    issues, all_reqs, covered_reqs = _collect_issues_and_reqs(func_map, coverage_map)

    print("\n=== DEBUG ===")
    print(f"all_reqs ({len(all_reqs)}):      {sorted(all_reqs)}")
    print(f"covered_reqs ({len(covered_reqs)}): {sorted(covered_reqs)}")
    print(f"issues ({len(issues)}):         {[i['ruleId'] for i in issues]}")
    print("=============\n")

    summary = _build_summary(all_reqs, covered_reqs)
    ...

    with open(output_path, "w") as f:
        json.dump({"summary": summary, "issues": issues}, f, indent=2)
# --- Script principale ---

@dataclass(frozen=True)
class ProjectConfig:
    name: str
    src: Path
    coverage: Path
    lang: Literal["py", "js"]

    @property
    def root(self) -> Path:
        return self.src.parent

    @property
    def extensions(self) -> List[str]:
        return ["*.py"] if self.lang == "py" else ["*.ts", "*.tsx"]


_PROJECTS: List[ProjectConfig] = [
    ProjectConfig("backend",  Path("backend/src"),  Path("backend/coverage.xml"),          "py"),
    ProjectConfig("frontend", Path("frontend/src"), Path("frontend/coverage/lcov.info"),   "js"),
]


def _extract_funcs(file_path: Path, lang: str) -> List[FuncInfo]:
    return extract_funcs_and_reqs_py(file_path) if lang == "py" else extract_funcs_and_reqs_js(file_path)


def _build_func_map(proj: ProjectConfig) -> Dict[str, List[FuncInfo]]:
    func_map: Dict[str, List[FuncInfo]] = {}
    for ext in proj.extensions:
        for file_path in proj.src.rglob(ext):
            rel_path = file_path.relative_to(proj.root).as_posix()
            if funcs := _extract_funcs(file_path, proj.lang):
                func_map[rel_path] = funcs
    return func_map


def _build_coverage_map(proj: ProjectConfig) -> Dict[str, Set[int]]:
    raw = (
        parse_coverage_xml(proj.coverage)
        if proj.lang == "py"
        else parse_lcov_info(proj.coverage, proj.root.resolve())
    )
    # Normalizza le chiavi garantendo il prefisso "src/"
    return {
        (f if f.startswith("src/") else f"src/{f}"): lines
        for f, lines in raw.items()
    }


def _merge_coverage(target: Dict[str, Set[int]], source: Dict[str, Set[int]]) -> None:
    for path, lines in source.items():
        target.setdefault(path, set()).update(lines)


def main() -> None:
    all_func_map: Dict[str, List[FuncInfo]] = {}
    all_coverage_map: Dict[str, Set[int]] = {}

    for proj in _PROJECTS:
        if not proj.src.exists():
            print(f"Warning: Directory '{proj.src}' does not exist!")
            continue

        all_func_map.update(_build_func_map(proj))
        _merge_coverage(all_coverage_map, _build_coverage_map(proj))

    output_path = Path("req_issues.json")
    generate_sonar_issues(all_func_map, all_coverage_map, output_path)
    print(f"File '{output_path}' generato per SonarQube.")


if __name__ == "__main__":
    main()