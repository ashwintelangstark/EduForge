import os
import csv
import json

def generate_sql(q_file, opt_file, sql_file, subject_title):
    print(f"Generating updated {sql_file} for {subject_title}...")
    with open(q_file, 'r', encoding='utf-8') as f:
        questions = list(csv.DictReader(f))
    with open(opt_file, 'r', encoding='utf-8') as f:
        options = list(csv.DictReader(f))

    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(f"-- =============================================================================\n")
        f.write(f"-- Complete Insert Script for {subject_title} (Standardized LaTeX & Diagram Assets)\n")
        f.write(f"-- =============================================================================\n\n")

        for q in questions:
            safe_raw = q["raw_text"].replace("'", "''")
            safe_content = q["content"].replace("'", "''")
            safe_exp = q["explanation"].replace("'", "''")
            f.write(f"INSERT INTO public.questions (id, question_code, subject_id, chapter_id, question_type, content, explanation, difficulty, marks, negative_marks, correct_option, raw_text) VALUES ('{q['id']}', '{q['question_code']}', '{q['subject_id']}', '{q['chapter_id']}', 'MCQ', '{safe_content}'::jsonb, '{safe_exp}'::jsonb, '{q['difficulty']}', {q['marks']}, {q['negative_marks']}, '{q['correct_option']}', '{safe_raw}') ON CONFLICT (question_code) DO UPDATE SET raw_text = EXCLUDED.raw_text, content = EXCLUDED.content;\n")

        f.write("\n-- Insert Options\n")
        for opt in options:
            safe_opt_raw = opt["raw_text"].replace("'", "''")
            safe_opt_content = opt["content"].replace("'", "''")
            f.write(f"INSERT INTO public.question_options (id, question_id, option_key, content, raw_text, sort_order) VALUES ('{opt['id']}', '{opt['question_id']}', '{opt['option_key']}', '{safe_opt_content}'::jsonb, '{safe_opt_raw}', {opt['sort_order']}) ON CONFLICT (id) DO NOTHING;\n")

    print(f"  ✓ {sql_file} successfully generated with {len(questions)} questions and {len(options)} options.")

generate_sql('physics_questions.csv', 'physics_question_options.csv', 'insert_physics_questions.sql', 'Physics -> Units and Measurements')
generate_sql('chemistry_questions.csv', 'chemistry_question_options.csv', 'insert_chemistry_questions.sql', 'Chemistry -> Some Basic Concepts of Chemistry')
generate_sql('bio_questions.csv', 'bio_question_options.csv', 'insert_living_world_questions.sql', 'Biology -> The Living World')

print("\n✓ ALL SQL INSERT SCRIPTS SYNCHRONIZED AND REGENERATED!")
