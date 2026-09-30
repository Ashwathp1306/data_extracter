import pandas as pd
import io
import re
from typing import List, Tuple
from app.models.schemas import StudentValidation

def extract_username(url: str, platform: str) -> str:
    """Extract username from LeetCode or GitHub URL safely."""
    if pd.isna(url) or not isinstance(url, str):
        return None
    url = url.strip().rstrip('/')
    if platform == "leetcode":
        # match leetcode.com/u/username or leetcode.com/username
        match = re.search(r'leetcode\.com/(?:u/)?([^/]+)', url)
        if match:
            return match.group(1)
        # fallback for raw username
        if "/" not in url and " " not in url:
            return url
    elif platform == "github":
        # match github.com/username
        match = re.search(r'github\.com/([^/]+)', url)
        if match:
            return match.group(1)
        # fallback for raw username
        if "/" not in url and " " not in url:
            return url
    return None

def validate_excel(file_content: bytes) -> Tuple[List[StudentValidation], bool, str]:
    """Parse and validate uploaded Excel file."""
    try:
        df = pd.read_excel(io.BytesIO(file_content))
    except Exception as e:
        return [], False, f"Invalid Excel file format: {str(e)}"
    
    # Check columns
    required_cols = ["Reg.No", "Name", "LeetCode Profile", "GitHub Profile"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        return [], False, f"Missing required columns: {', '.join(missing_cols)}"
    
    # Process rows
    students = []
    seen_reg_no = set()
    seen_lc = set()
    seen_gh = set()
    
    for idx, row in df.iterrows():
        reg_no = str(row.get("Reg.No", "")).strip()
        if reg_no == "nan" or not reg_no:
            continue # skip empty rows
            
        name = str(row.get("Name", "")).strip()
        lc_url = str(row.get("LeetCode Profile", "")).strip()
        gh_url = str(row.get("GitHub Profile", "")).strip()
        
        is_valid = True
        messages = []
        
        if name == "nan" or not name:
            is_valid = False
            messages.append("Name is missing")
            name = "Unknown"
            
        if reg_no in seen_reg_no:
            is_valid = False
            messages.append("Duplicate Registration Number")
        else:
            seen_reg_no.add(reg_no)
            
        lc_username = extract_username(lc_url, "leetcode")
        if not lc_username:
            is_valid = False
            messages.append("Invalid LeetCode Profile URL")
        elif lc_username in seen_lc:
            is_valid = False
            messages.append("Duplicate LeetCode Profile")
        else:
            seen_lc.add(lc_username)
            
        gh_username = extract_username(gh_url, "github")
        if not gh_username:
            is_valid = False
            messages.append("Invalid GitHub Profile URL")
        elif gh_username in seen_gh:
            is_valid = False
            messages.append("Duplicate GitHub Profile")
        else:
            seen_gh.add(gh_username)
            
        student = StudentValidation(
            reg_no=reg_no,
            name=name,
            leetcode_url=lc_url,
            github_url=gh_url,
            is_valid=is_valid,
            validation_message="; ".join(messages) if messages else None,
            leetcode_username=lc_username,
            github_username=gh_username
        )
        students.append(student)
        
    if not students:
        return [], False, "Excel file contains no valid student rows"
        
    return students, True, "Success"

def generate_report_excel(results: list, summary: dict) -> bytes:
    """Generate the final Excel report."""
    output = io.BytesIO()
    
    # Sheet 1: Results
    data = []
    for r in results:
        data.append({
            "Reg.No": r.reg_no,
            "Name": r.name,
            "Easy": r.easy if r.status != "Failed" else "N/A",
            "Medium": r.medium if r.status != "Failed" else "N/A",
            "Hard": r.hard if r.status != "Failed" else "N/A",
            "Total Solved": r.total_solved if r.status != "Failed" else "N/A",
            "No. of Repositories": r.repo_count if r.status != "Failed" else "N/A",
            "Status": r.status,
            "Error Details": r.error_message or ""
        })
    df_results = pd.DataFrame(data)
    
    # Sheet 2: Summary
    df_summary = pd.DataFrame([{
        "Total Students": summary.get("total", 0),
        "Successfully Processed": summary.get("successful", 0),
        "Partial Results": summary.get("partial", 0),
        "Failed": summary.get("failed", 0),
        "Generation Date": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")
    }])
    
    # Sheet 3: Errors
    df_errors = df_results[df_results["Status"].isin(["Failed", "Partial Results"])]
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df_results.to_excel(writer, sheet_name='Student Report', index=False)
        df_summary.to_excel(writer, sheet_name='Processing Summary', index=False)
        if not df_errors.empty:
            df_errors.to_excel(writer, sheet_name='Errors', index=False)
            
        # Optional: formatting with openpyxl
        workbook = writer.book
        for sheet_name in workbook.sheetnames:
            worksheet = workbook[sheet_name]
            for col in worksheet.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(cell.value)
                    except:
                        pass
                adjusted_width = (max_length + 2)
                worksheet.column_dimensions[column].width = min(adjusted_width, 50)
                
            # Freeze top row
            worksheet.freeze_panes = 'A2'
            
    return output.getvalue()
