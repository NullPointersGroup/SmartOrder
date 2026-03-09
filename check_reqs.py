import xml.etree.ElementTree as ET
import ast
from pathlib import Path
from typing import List, Dict, Set, TypedDict, Optional
import json
import re

# --- Totale requisiti per categoria ---
TOT_OBBLIG: int = 110
TOT_DESID: int = 146
TOT_OPZ: int = 17

# --- TypedDict per le funzioni ---
class FuncInfo(TypedDict):
    name: str
    start: int
    end: int
    reqs: List[str]

# --- Parsing funzioni/metodi Python ---
def extract_funcs_and_reqs_py(file_path: Path) -> List[FuncInfo]:
    funcs: List[FuncInfo] = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        if not content.strip():
            return funcs
        tree = ast.parse(content, filename=str(file_path))
    except (SyntaxError, UnicodeDecodeError) as e:
        print(f"Warning: Could not parse {file_path}: {e}")
        return funcs

    def process_function(node: ast.FunctionDef, class_path: str = "") -> None:
        docstring: Optional[str] = ast.get_docstring(node)
        reqs: List[str] = []
        if docstring:
            reqs = [line.split()[1] for line in docstring.splitlines() if line.strip().startswith("@req")]
        end_lineno: int = node.end_lineno if node.end_lineno is not None else node.lineno
        func_name = f"{class_path}.{node.name}" if class_path else node.name
        funcs.append(FuncInfo(name=func_name, start=node.lineno, end=end_lineno, reqs=reqs))

    def process_class(node: ast.ClassDef, parent_path: str = "") -> None:
        current_path = f"{parent_path}.{node.name}" if parent_path else node.name
        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                process_function(item, class_path=current_path)
            elif isinstance(item, ast.ClassDef):
                process_class(item, parent_path=current_path)

    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            process_function(node)
        elif isinstance(node, ast.ClassDef):
            process_class(node)
    return funcs

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
# FIX: accept proj_root so we can produce keys relative to it (e.g. "src/add.py")
def parse_coverage_xml(coverage_xml_path: Path, proj_root: Path) -> Dict[str, Set[int]]:
    file_coverage: Dict[str, Set[int]] = {}
    try:
        tree = ET.parse(coverage_xml_path)
    except (ET.ParseError, FileNotFoundError) as e:
        print(f"Warning: Could not parse {coverage_xml_path}: {e}")
        return file_coverage
    root = tree.getroot()
    for cls in root.findall(".//class"):
        filename_raw = cls.get("filename")
        if not filename_raw:
            continue
        # FIX: keep the path as-is from coverage.xml (already relative to proj_root,
        # e.g. "src/add.py"). No more relative_to("src") that was stripping the prefix.
        rel_filename = Path(filename_raw).as_posix()
        lines: Set[int] = set()
        for line in cls.findall("lines/line"):
            number_raw = line.get("number")
            hits_raw = line.get("hits")
            if number_raw is None or hits_raw is None:
                continue
            if int(hits_raw) > 0:
                lines.add(int(number_raw))
        if rel_filename in file_coverage:
            file_coverage[rel_filename] |= lines
        else:
            file_coverage[rel_filename] = lines
    return file_coverage

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
def generate_sonar_issues(func_map: Dict[str, List[FuncInfo]],
                          coverage_map: Dict[str, Set[int]],
                          output_path: Path) -> None:
    issues: List[Dict] = []
    
    all_reqs: Set[str] = set()
    covered_reqs: Set[str] = set()

    for file_rel, funcs in func_map.items():
        covered_lines: Set[int] = coverage_map.get(file_rel, set())
        for f in funcs:
            body_lines = range(f["start"] + 1, f["end"] + 1)
            is_covered: bool = any(line in covered_lines for line in body_lines)
            for req in f["reqs"]:
                all_reqs.add(req)
                if is_covered:
                    covered_reqs.add(req)
                else:
                    issues.append({
                        "ruleId": req,
                        "primaryLocation": {
                            "message": f"Requisito {req} NON soddisfatto",
                            "filePath": file_rel,
                            "textRange": {"startLine": f["start"], "endLine": f["end"]}
                        }
                    })

    # Percentuali per categoria
    def pct(cat: str) -> float:
        tot = {"obblig": TOT_OBBLIG, "desid": TOT_DESID, "opz": TOT_OPZ}.get(cat, 0)
        if tot == 0:
            return 0.0
        covered = sum(1 for r in covered_reqs if categorize_req(r) == cat)
        return round(covered / tot * 100, 1)

    total = len(all_reqs)
    summary = {
        "totale_requisiti": {
            "obbligatori": TOT_OBBLIG,
            "desiderabili": TOT_DESID,
            "opzionali": TOT_OPZ,
            "globale": TOT_OBBLIG + TOT_DESID + TOT_OPZ,
        },
        "coperti": {
            "obbligatori": sum(1 for r in covered_reqs if categorize_req(r) == "obblig"),
            "desiderabili": sum(1 for r in covered_reqs if categorize_req(r) == "desid"),
            "opzionali": sum(1 for r in covered_reqs if categorize_req(r) == "opz"),
            "globale": len(covered_reqs),
        },
        "non_coperti": {
            "obbligatori": sum(1 for r in all_reqs - covered_reqs if categorize_req(r) == "obblig"),
            "desiderabili": sum(1 for r in all_reqs - covered_reqs if categorize_req(r) == "desid"),
            "opzionali": sum(1 for r in all_reqs - covered_reqs if categorize_req(r) == "opz"),
            "globale": len(all_reqs - covered_reqs),
        },
        "per_categoria": {
            "obbligatori": pct("obblig"),
            "desiderabili": pct("desid"),
            "opzionali":   pct("opz"),
        }
    }

    with open(output_path, "w") as f:
        json.dump({"summary": summary, "issues": issues} if issues else {"summary": summary, "issues": "Tutto apposto"}, f, indent=2)

# --- Script principale ---
def main() -> None:

    projects = [
        {"name": "backend", "src": Path("backend/src"), "coverage": Path("backend/coverage.xml"), "lang": "py"},
        {"name": "frontend", "src": Path("frontend/src"), "coverage": Path("frontend/coverage/lcov.info"), "lang": "js"},
    ]

    all_func_map: Dict[str, List[FuncInfo]] = {}
    all_coverage_map: Dict[str, Set[int]] = {}

    for proj in projects:
        src_path: Path = proj["src"]
        coverage_path: Path = proj["coverage"]
        lang: str = proj["lang"]
        # FIX: sub-project root (e.g. Path("backend") or Path("frontend"))
        proj_root: Path = src_path.parent

        if not src_path.exists():
            print(f"Warning: Directory '{src_path}' does not exist!")
            continue

        # Funzioni/metodi
        func_map: Dict[str, List[FuncInfo]] = {}
        for ext in (["*.py"] if lang == "py" else ["*.ts", "*.tsx"]):
            for file_path in src_path.rglob(ext):
                # FIX: key relative to proj_root → "src/add.py" or "src/Counter.tsx"
                rel_path = file_path.relative_to(proj_root).as_posix()
                funcs = extract_funcs_and_reqs_py(file_path) if lang == "py" else extract_funcs_and_reqs_js(file_path)
                if funcs:
                    func_map[rel_path] = funcs

        # Coverage — pass proj_root for consistent key generation
        coverage_map = (
            parse_coverage_xml(coverage_path, proj_root)
            if lang == "py"
            else parse_lcov_info(coverage_path, proj_root.resolve())
        )

        # accumula globale
        all_func_map.update(func_map)
        for f, lines in coverage_map.items():
            if f in all_coverage_map:
                all_coverage_map[f] |= lines
            else:
                all_coverage_map[f] = lines
                
        normalized_coverage: Dict[str, Set[int]] = {}
        for f, lines in coverage_map.items():
            key = f if f.startswith("src/") else f"src/{f}"
            normalized_coverage[key] = lines

        # accumula globale
        all_func_map.update(func_map)
        for f, lines in normalized_coverage.items():
            if f in all_coverage_map:
                all_coverage_map[f] |= lines
            else:
                all_coverage_map[f] = lines

    # Genera JSON Sonar unico
    output_path = Path("req_issues.json")
    generate_sonar_issues(all_func_map, all_coverage_map, output_path)
    print(f"File '{output_path}' generato per SonarQube.")

if __name__ == "__main__":
    main()