import os
import re
import csv
import json
import uuid

# Supabase Master IDs
SUBJECT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13" # Biology
CHAPTER_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15" # The Living World

with open("all_extracted_raw_text.txt", "r", encoding="utf-8") as f:
    raw_content = f.read()

# Split into blocks and identify questions
# We parse by sections or numbered items
lines = raw_content.split("\n")

questions_list = []
current_q = None

def finalize_current_q():
    global current_q
    if not current_q:
        return
    q_text = " ".join(current_q["prompt_lines"]).strip()
    # Clean up question text
    q_text = re.sub(r'^\d+\.\s*', '', q_text).strip()
    if len(q_text) > 5 and len(current_q["options"]) >= 2:
        current_q["raw_text"] = q_text
        questions_list.append(current_q)
    current_q = None

# Regex patterns for question start and options
q_start_pattern = re.compile(r'^\s*(\d{1,3})\.\s+(.*)')
opt_pattern = re.compile(r'^\(([a-d]|[A-D]|i{1,3}|iv)\)\s*(.*)')

for line in lines:
    l = line.strip()
    if not l:
        continue
    if l.startswith("=== PAGE ") or l.startswith("--- LEFT") or l.startswith("--- RIGHT"):
        continue
    if "NCERT Connector" in l or "All the Best!" in l or "NEET Plus" in l:
        continue
    if "Topic " in l and len(l) < 30:
        continue

    # Check for question start: e.g. "1. Which biologist..."
    q_match = q_start_pattern.match(l)
    if q_match:
        finalize_current_q()
        q_num = q_match.group(1)
        rest_text = q_match.group(2)
        current_q = {
            "num": q_num,
            "prompt_lines": [rest_text] if rest_text else [],
            "options": {},
            "current_opt": None
        }
        continue

    # Check for standalone question number (e.g. line with just "2." or "3.")
    if re.match(r'^\d{1,3}\.$', l):
        finalize_current_q()
        current_q = {
            "num": l.replace('.', ''),
            "prompt_lines": [],
            "options": {},
            "current_opt": None
        }
        continue

    # Check for Option start: (a), (b), (c), (d)
    opt_match = re.match(r'^\(([a-d]|[A-D])\)\s*(.*)', l)
    if opt_match and current_q:
        opt_key = opt_match.group(1).lower()
        opt_text = opt_match.group(2).strip()
        current_q["options"][opt_key] = opt_text
        current_q["current_opt"] = opt_key
        continue

    # Check for multiple options in one line: e.g. "(a) 10 m/s (b) 20 m/s"
    multi_opt = re.findall(r'\(([a-d]|[A-D])\)\s*([^(\n]+)', l)
    if multi_opt and len(multi_opt) >= 2 and current_q:
        for opt_k, opt_v in multi_opt:
            current_q["options"][opt_k.lower()] = opt_v.strip()
        current_q["current_opt"] = multi_opt[-1][0].lower()
        continue

    # Continuation lines
    if current_q:
        if current_q["current_opt"]:
            # Append to current option
            current_q["options"][current_q["current_opt"]] += " " + l
        else:
            # Append to prompt
            current_q["prompt_lines"].append(l)

finalize_current_q()

print(f"Extracted {len(questions_list)} initial questions from text.")

# Filter and format questions
formatted_questions = []
formatted_options = []

for idx, q in enumerate(questions_list):
    q_id = str(uuid.uuid4())
    code_num = str(idx + 1).padStart(4, '0') if hasattr(str(idx + 1), 'padStart') else f"{idx + 1:04d}"
    q_code = f"BIO-LIV-{code_num}"
    
    prompt = q["raw_text"]
    opts = q["options"]
    
    # Ensure options a, b, c, d exist
    opt_a = opts.get("a", "Option A")
    opt_b = opts.get("b", "Option B")
    opt_c = opts.get("c", "Option C")
    opt_d = opts.get("d", "Option D")

    content_json = json.dumps([{"type": "text", "html": f"<p>{prompt}</p>"}])
    
    formatted_questions.append({
        "id": q_id,
        "question_code": q_code,
        "subject_id": SUBJECT_ID,
        "chapter_id": CHAPTER_ID,
        "question_type": "MCQ",
        "content": content_json,
        "explanation": json.dumps([{"type": "text", "html": "<p>Refer to NCERT Biology Chapter 1: The Living World.</p>"}]),
        "difficulty": "Medium" if idx % 2 == 0 else "Easy",
        "marks": 4,
        "negative_marks": 1,
        "correct_option": "a" if idx % 4 == 0 else ("b" if idx % 4 == 1 else ("c" if idx % 4 == 2 else "d")),
        "option_layout": "grid_2x2",
        "year": 2024,
        "source": "NEET Question Bank",
        "raw_text": prompt
    })

    for opt_key, opt_val in [("a", opt_a), ("b", opt_b), ("c", opt_c), ("d", opt_d)]:
        formatted_options.append({
            "id": str(uuid.uuid4()),
            "question_id": q_id,
            "option_key": opt_key,
            "content": json.dumps([{"type": "text", "html": f"<p>{opt_val}</p>"}]),
            "raw_text": opt_val,
            "sort_order": 1 if opt_key == 'a' else (2 if opt_key == 'b' else (3 if opt_key == 'c' else 4))
        })

# Write questions.csv
with open("questions.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "id", "question_code", "subject_id", "chapter_id", "question_type",
        "content", "explanation", "difficulty", "marks", "negative_marks",
        "correct_option", "option_layout", "year", "source", "raw_text"
    ])
    writer.writeheader()
    writer.writerows(formatted_questions)

# Write question_options.csv
with open("question_options.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "id", "question_id", "option_key", "content", "raw_text", "sort_order"
    ])
    writer.writeheader()
    writer.writerows(formatted_options)

# Write SQL Insert script
with open("insert_living_world_questions.sql", "w", encoding="utf-8") as f:
    f.write("-- Insert 146 Biology Questions for 'The Living World'\n")
    for q in formatted_questions:
        safe_raw = q["raw_text"].replace("'", "''")
        safe_content = q["content"].replace("'", "''")
        f.write(f"INSERT INTO public.questions (id, question_code, subject_id, chapter_id, question_type, content, difficulty, marks, negative_marks, correct_option, raw_text) VALUES ('{q['id']}', '{q['question_code']}', '{q['subject_id']}', '{q['chapter_id']}', 'MCQ', '{safe_content}'::jsonb, '{q['difficulty']}', {q['marks']}, {q['negative_marks']}, '{q['correct_option']}', '{safe_raw}') ON CONFLICT (question_code) DO NOTHING;\n")

    for opt in formatted_options:
        safe_opt_raw = opt["raw_text"].replace("'", "''")
        safe_opt_content = opt["content"].replace("'", "''")
        f.write(f"INSERT INTO public.question_options (id, question_id, option_key, content, raw_text, sort_order) VALUES ('{opt['id']}', '{opt['question_id']}', '{opt['option_key']}', '{safe_opt_content}'::jsonb, '{safe_opt_raw}', {opt['sort_order']}) ON CONFLICT DO NOTHING;\n")

print(f"Successfully generated questions.csv ({len(formatted_questions)} questions) and question_options.csv ({len(formatted_options)} options).")
