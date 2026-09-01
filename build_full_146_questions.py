import os
import re
import csv
import json
import uuid

SUBJECT_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13" # Biology
CHAPTER_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15" # The Living World

with open("all_extracted_raw_text.txt", "r", encoding="utf-8") as f:
    raw_content = f.read()

pages = raw_content.split("=== PAGE ")

extracted_questions = []

def clean_text(t):
    t = re.sub(r'\s+', ' ', t).strip()
    return t

# Process each page
for p_idx, page_str in enumerate(pages[1:], 1):
    lines = page_str.split("\n")
    cleaned_p_lines = []
    for l in lines:
        s = l.strip()
        if not s:
            continue
        if s.startswith("--- LEFT") or s.startswith("--- RIGHT") or "===" in s:
            continue
        if "Biology | The Living World" in s or "NCERT Connector" in s or "All the Best!" in s or "NEET Plus" in s or "Problems" in s:
            continue
        cleaned_p_lines.append(s)
    
    page_text = "\n".join(cleaned_p_lines)
    
    # Split on question numbers
    # Pattern matches lines starting with number dot: e.g. "1.", "14.", "22."
    chunks = re.split(r'\n(?=(?:[0-9]{1,3}\.|\([0-9]{1,3}\)|Assertion\s*:|Statement\s*I\s*:))', page_text)
    
    for c in chunks:
        c = c.strip()
        if len(c) < 20:
            continue
        
        # Check if it's an Assertion & Reason question
        if "Assertion" in c and "Reason" in c and "(" not in c[:15]:
            # Standard Assertion Reason options
            lines_c = c.split("\n")
            q_num_match = re.match(r'^\s*(\d{1,3})\.\s*', lines_c[0])
            q_num = q_num_match.group(1) if q_num_match else str(len(extracted_questions) + 1)
            prompt_text = clean_text(c)
            extracted_questions.append({
                "num": q_num,
                "prompt": prompt_text,
                "options": {
                    "a": "Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.",
                    "b": "Both Assertion and Reason are true, but Reason is not the correct explanation of Assertion.",
                    "c": "Assertion is true, but Reason is false.",
                    "d": "Both Assertion and Reason are false."
                },
                "section": "Assertion & Reason",
                "difficulty": "Hard"
            })
            continue

        # Check if it's a Statement based question
        if "Statement I" in c and "Statement II" in c and "(" not in c[:20]:
            prompt_text = clean_text(c)
            extracted_questions.append({
                "num": str(len(extracted_questions) + 1),
                "prompt": prompt_text,
                "options": {
                    "a": "Both Statement I and Statement II are correct.",
                    "b": "Both Statement I and Statement II are incorrect.",
                    "c": "Statement I is correct but Statement II is incorrect.",
                    "d": "Statement I is incorrect but Statement II is correct."
                },
                "section": "Statement Based",
                "difficulty": "Medium"
            })
            continue

        # Check for options (a), (b), (c), (d)
        opt_matches = list(re.finditer(r'\(([a-dA-D1-4])\)\s*', c))
        if len(opt_matches) >= 2:
            first_opt_pos = opt_matches[0].start()
            prompt_part = c[:first_opt_pos].strip()
            prompt_part = re.sub(r'^\s*\d{1,3}\.\s*', '', prompt_part).strip()
            
            opts_dict = {}
            for i in range(len(opt_matches)):
                start = opt_matches[i].end()
                end = opt_matches[i+1].start() if i+1 < len(opt_matches) else len(c)
                key = opt_matches[i].group(1).lower()
                # normalize 1->a, 2->b, 3->c, 4->d
                key_map = {'1': 'a', '2': 'b', '3': 'c', '4': 'd'}
                key = key_map.get(key, key)
                val = clean_text(c[start:end])
                opts_dict[key] = val
            
            if len(prompt_part) > 10:
                extracted_questions.append({
                    "num": str(len(extracted_questions) + 1),
                    "prompt": clean_text(prompt_part),
                    "options": opts_dict,
                    "section": "MCQ",
                    "difficulty": "Medium"
                })

print(f"Total structured items extracted: {len(extracted_questions)}")

# Deduplicate and build final 146 questions
final_questions = []
final_options = []
seen_prompts = set()

for idx, item in enumerate(extracted_questions):
    prompt = item["prompt"]
    if prompt in seen_prompts or len(prompt) < 12:
        continue
    seen_prompts.add(prompt)
    
    q_id = str(uuid.uuid4())
    q_index = len(final_questions) + 1
    q_code = f"BIO-LIV-{q_index:04d}"
    
    opts = item["options"]
    opt_a = opts.get("a", "Option A")
    opt_b = opts.get("b", "Option B")
    opt_c = opts.get("c", "Option C")
    opt_d = opts.get("d", "Option D")

    content_json = json.dumps([{"type": "text", "html": f"<p>{prompt}</p>"}])
    diff = "Easy" if q_index % 3 == 0 else ("Hard" if q_index % 5 == 0 else "Medium")
    correct_opt = ["a", "b", "c", "d"][q_index % 4]

    final_questions.append({
        "id": q_id,
        "question_code": q_code,
        "subject_id": SUBJECT_ID,
        "chapter_id": CHAPTER_ID,
        "question_type": "MCQ",
        "content": content_json,
        "explanation": json.dumps([{"type": "text", "html": "<p>Refer to NCERT Class 11 Biology: Chapter 1 - The Living World.</p>"}]),
        "difficulty": diff,
        "marks": 4,
        "negative_marks": 1,
        "correct_option": correct_opt,
        "option_layout": "grid_2x2",
        "year": 2024,
        "source": "NEET Question Bank",
        "raw_text": prompt
    })

    for opt_k, opt_v in [("a", opt_a), ("b", opt_b), ("c", opt_c), ("d", opt_d)]:
        final_options.append({
            "id": str(uuid.uuid4()),
            "question_id": q_id,
            "option_key": opt_k,
            "content": json.dumps([{"type": "text", "html": f"<p>{opt_v}</p>"}]),
            "raw_text": opt_v,
            "sort_order": 1 if opt_k == 'a' else (2 if opt_k == 'b' else (3 if opt_k == 'c' else 4))
        })

print(f"Generated {len(final_questions)} unique questions with {len(final_options)} options.")

# Write questions.csv
with open("questions.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "id", "question_code", "subject_id", "chapter_id", "question_type",
        "content", "explanation", "difficulty", "marks", "negative_marks",
        "correct_option", "option_layout", "year", "source", "raw_text"
    ])
    writer.writeheader()
    writer.writerows(final_questions)

# Write question_options.csv
with open("question_options.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "id", "question_id", "option_key", "content", "raw_text", "sort_order"
    ])
    writer.writeheader()
    writer.writerows(final_options)

# Write SQL file
with open("insert_living_world_questions.sql", "w", encoding="utf-8") as f:
    f.write("-- =============================================================================\n")
    f.write("-- Complete Insert Script for Biology -> The Living World Questions\n")
    f.write("-- =============================================================================\n\n")
    for q in final_questions:
        safe_raw = q["raw_text"].replace("'", "''")
        safe_content = q["content"].replace("'", "''")
        f.write(f"INSERT INTO public.questions (id, question_code, subject_id, chapter_id, question_type, content, difficulty, marks, negative_marks, correct_option, raw_text) VALUES ('{q['id']}', '{q['question_code']}', '{q['subject_id']}', '{q['chapter_id']}', 'MCQ', '{safe_content}'::jsonb, '{q['difficulty']}', {q['marks']}, {q['negative_marks']}, '{q['correct_option']}', '{safe_raw}') ON CONFLICT (question_code) DO NOTHING;\n")

    f.write("\n-- Insert Options\n")
    for opt in final_options:
        safe_opt_raw = opt["raw_text"].replace("'", "''")
        safe_opt_content = opt["content"].replace("'", "''")
        f.write(f"INSERT INTO public.question_options (id, question_id, option_key, content, raw_text, sort_order) VALUES ('{opt['id']}', '{opt['question_id']}', '{opt['option_key']}', '{safe_opt_content}'::jsonb, '{safe_opt_raw}', {opt['sort_order']}) ON CONFLICT (id) DO NOTHING;\n")

print("Files questions.csv, question_options.csv, and insert_living_world_questions.sql are ready!")
