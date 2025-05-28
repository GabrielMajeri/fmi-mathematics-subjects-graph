import csv
import json
import re
import argparse
import os


def get_specialization_from_filename(filepath: str) -> str:
    """
    Extract specialization (profile) from CSV filename.
    Expected formats like "curs_mate.csv", "curs_mate_aplicata.csv", "curs_mate_info.csv",
    but also tries fallback for names like "cursuri Mate-Aplicata-1.csv".
    """
    basename = os.path.basename(filepath)
    name_lower = basename.lower()

    # Prioritize "curs_{specialization}.csv" format
    match = re.match(
        r"curs_([a-zA-Z0-9_]+?)(?:-\d)?\.csv", name_lower
    )  # Optional "-1" etc.
    if match:
        specialization_part = match.group(1)
        if specialization_part == "mate_aplicata":
            return "mate_aplicata"
        elif specialization_part == "mate_info":
            return "mate_info"
        elif specialization_part == "mate":
            return "mate"

    # Fallback heuristic for other filename formats
    if "mate-aplicata" in name_lower or "mate_aplicata" in name_lower:
        return "mate_aplicata"
    elif "mate-info" in name_lower or "mate_info" in name_lower:
        return "mate_info"
    elif "mate" in name_lower:  # Checked last, being more general
        return "mate"

    print(
        f"Warning: Could not determine specialization from filename: {basename}. Using 'unknown'."
    )
    return "unknown"


def process_csvs_to_json(csv_filepaths: list[str], output_json_path: str):
    """
    Process CSV files (where dependencies column already contains IDs)
    to generate a JSON file with course data.
    Adds 'specialization' field based on filename and renames 'profile' to 'module'.
    """
    all_final_course_objects = []

    year_sem_module_regex = re.compile(
        r"Anul\s*(\d+)\s*,\s*Semestrul\s*(\d+)(?:\s*\(\s*Modul:\s*(.*?)\s*\))?"
    )

    for filepath in csv_filepaths:
        file_specialization = get_specialization_from_filename(filepath)

        current_year = None
        current_sem = None
        current_anul3_module_name = None  # Year 3 specific module

        print(
            f"Processing file: {filepath} (Deduced specialization: {file_specialization})..."
        )

        try:
            with open(filepath, mode="r", encoding="utf-8") as infile:
                reader = csv.reader(infile)
                try:
                    header = next(reader)
                except StopIteration:
                    print(
                        f"Warning: CSV file '{filepath}' is empty or has no header. Continuing..."
                    )
                    continue

                for i, row in enumerate(reader, 1):
                    if not any(field.strip() for field in row):
                        continue

                    title_cell = row[0].strip()
                    match_context = year_sem_module_regex.fullmatch(title_cell)
                    is_context_line = match_context and all(
                        not cell.strip() for cell in row[1:]
                    )

                    if is_context_line:
                        current_year = int(match_context.group(1))
                        current_sem = int(match_context.group(2))
                        current_anul3_module_name = (
                            match_context.group(3).strip()
                            if match_context.group(3)
                            else None
                        )
                        continue

                    if not title_cell or title_cell.lower() == "titlul cursului":
                        continue

                    if current_year is None or current_sem is None:
                        print(
                            f"Warning: Course '{title_cell}' (row {i+1} in '{filepath}') was found before Year/Semester definition. Skipping."
                        )
                        continue

                    course_name = title_cell
                    course_id_from_csv = row[1].strip() if len(row) > 1 else ""

                    if not course_id_from_csv:
                        print(
                            f"CRITICAL ERROR: Course '{course_name}' (row {i+1} in '{filepath}') has no Acronym/ID. This field is mandatory. Course skipped."
                        )
                        continue

                    actual_id = course_id_from_csv.lower()

                    dependencies_ids_str = row[2].strip() if len(row) > 2 else ""
                    prerequisites_final_ids = []
                    if (
                        dependencies_ids_str
                        and dependencies_ids_str.lower() != "niciuna"
                    ):
                        ids_list = [
                            id_val.strip().lower()
                            for id_val in dependencies_ids_str.split(",")
                            if id_val.strip()
                        ]
                        prerequisites_final_ids.extend(ids_list)

                    keywords = [
                        kw.strip() for kw in row[3:7] if len(row) > 6 and kw.strip()
                    ]
                    details_url = row[7].strip() if len(row) > 7 else ""

                    course_obj = {
                        "name": course_name,
                        "id": actual_id,
                        "year": current_year,
                        "sem": current_sem,
                        "specialization": file_specialization,  # New field added
                    }

                    if prerequisites_final_ids:
                        course_obj["pre"] = prerequisites_final_ids
                    if keywords:
                        course_obj["keywords"] = keywords
                    if details_url:
                        course_obj["details_url"] = details_url
                    if current_anul3_module_name:  # Year 3 module
                        course_obj["module"] = (
                            current_anul3_module_name  # Renamed from "profile"
                        )

                    all_final_course_objects.append(course_obj)

        except FileNotFoundError:
            print(f"Error: File '{filepath}' not found.")
            continue
        except Exception as e:
            print(f"Error processing file '{filepath}': {e}")
            continue

    try:
        with open(output_json_path, "w", encoding="utf-8") as outfile:
            json.dump(all_final_course_objects, outfile, ensure_ascii=False, indent=2)
        print(f"JSON file generated successfully: {output_json_path}")
    except IOError:
        print(f"Error: Could not write to output file {output_json_path}")
    except Exception as e:
        print(f"Error writing JSON file: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Process CSV files (with IDs in dependencies column) to generate JSON. Adds 'specialization' and uses 'module'."
    )
    parser.add_argument(
        "csv_files",
        nargs="+",
        help="List of input CSV files (dependencies column must contain IDs). Expected filename format: curs_specialization.csv",
    )
    parser.add_argument("output_json", help="Path to output JSON file.")

    args = parser.parse_args()

    process_csvs_to_json(args.csv_files, args.output_json)
