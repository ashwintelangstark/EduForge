import os
import csv
import json
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

with open('physics_questions.csv', 'r', encoding='utf-8') as f:
    questions = list(csv.DictReader(f))

print(f'Total Physics questions to sync: {len(questions)}')

for i in range(0, len(questions), 15):
    chunk = questions[i:i+15]
    processed_chunk = []
    for q in chunk:
        processed_chunk.append({
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
    supabase.table('questions').upsert(processed_chunk, on_conflict='question_code').execute()
    print(f'  Synced questions {i+1} to {min(i+15, len(questions))}')
    time.sleep(0.3)

with open('physics_question_options.csv', 'r', encoding='utf-8') as f:
    options = list(csv.DictReader(f))

print(f'Total Physics options to sync: {len(options)}')

for i in range(0, len(options), 30):
    chunk = options[i:i+30]
    processed_chunk = []
    for o in chunk:
        processed_chunk.append({
            'id': o['id'],
            'question_id': o['question_id'],
            'option_key': o['option_key'],
            'content': json.loads(o['content']),
            'raw_text': o['raw_text'],
            'sort_order': int(o['sort_order'])
        })
    supabase.table('question_options').upsert(processed_chunk, on_conflict='id').execute()
    print(f'  Synced options {i+1} to {min(i+30, len(options))}')
    time.sleep(0.3)

print('SUCCESSFULLY SYNCED ALL PHYSICS QUESTIONS AND OPTIONS TO SUPABASE!')
