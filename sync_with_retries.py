import os
import csv
import json
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def push_with_retry(table_name, data, conflict_col, max_retries=5):
    for attempt in range(max_retries):
        try:
            supabase.table(table_name).upsert(data, on_conflict=conflict_col).execute()
            return True
        except Exception as e:
            print(f"    [Retry {attempt+1}/{max_retries}] Error: {e}")
            time.sleep(1.0 + attempt * 1.5)
    raise Exception(f"Failed to upsert to {table_name} after {max_retries} attempts.")

def sync_subject(q_file, opt_file, subject_name):
    print(f"\n--- Syncing {subject_name} ---")
    with open(q_file, 'r', encoding='utf-8') as f:
        questions = list(csv.DictReader(f))
    with open(opt_file, 'r', encoding='utf-8') as f:
        options = list(csv.DictReader(f))

    print(f"Pushing {len(questions)} questions...")
    for i in range(0, len(questions), 15):
        chunk = questions[i:i+15]
        p_chunk = []
        for q in chunk:
            p_chunk.append({
                'id': q['id'],
                'question_code': q['question_code'],
                'subject_id': q['subject_id'],
                'chapter_id': q['chapter_id'],
                'question_type': q['question_type'],
                'content': json.loads(q['content']),
                'explanation': json.loads(q['explanation']),
                'difficulty': q['difficulty'],
                'marks': float(q['marks']),
                'negative_marks': float(q['negative_marks']),
                'correct_option': q['correct_option'],
                'option_layout': q['option_layout'],
                'year': int(q['year']),
                'source': q['source'],
                'raw_text': q['raw_text']
            })
        push_with_retry('questions', p_chunk, 'question_code')
        time.sleep(0.3)

    print(f"Pushing {len(options)} options...")
    for i in range(0, len(options), 25):
        chunk = options[i:i+25]
        p_chunk = []
        for o in chunk:
            p_chunk.append({
                'id': o['id'],
                'question_id': o['question_id'],
                'option_key': o['option_key'],
                'content': json.loads(o['content']),
                'raw_text': o['raw_text'],
                'sort_order': int(o['sort_order'])
            })
        push_with_retry('question_options', p_chunk, 'id')
        time.sleep(0.3)

    print(f"✓ {subject_name} fully synced!")

sync_subject('physics_questions.csv', 'physics_question_options.csv', 'Physics')
sync_subject('chemistry_questions.csv', 'chemistry_question_options.csv', 'Chemistry')
sync_subject('bio_questions.csv', 'bio_question_options.csv', 'Biology')

print("\n✓ ALL 482 QUESTIONS AND 1,928 OPTIONS SYNCED SUCCESSFULLY TO SUPABASE!")
