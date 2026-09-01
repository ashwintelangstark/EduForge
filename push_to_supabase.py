import os
import csv
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

def push_data():
    with open("questions.csv", "r", encoding="utf-8") as f:
        questions = list(csv.DictReader(f))
        for q in questions:
            q["content"] = json.loads(q["content"])
            q["explanation"] = json.loads(q["explanation"])
            q["marks"] = float(q["marks"])
            q["negative_marks"] = float(q["negative_marks"])
            q["year"] = int(q["year"])

    print(f"Pushing {len(questions)} questions to Supabase...")
    for i in range(0, len(questions), 40):
        chunk = questions[i:i+40]
        res = supabase.table("questions").upsert(chunk, on_conflict="question_code").execute()
        print(f"  Pushed questions chunk {i+1} to {min(i+40, len(questions))}")

    with open("question_options.csv", "r", encoding="utf-8") as f:
        options = list(csv.DictReader(f))
        for o in options:
            o["content"] = json.loads(o["content"])
            o["sort_order"] = int(o["sort_order"])

    print(f"Pushing {len(options)} question options to Supabase...")
    for i in range(0, len(options), 80):
        chunk = options[i:i+80]
        res = supabase.table("question_options").upsert(chunk, on_conflict="id").execute()
        print(f"  Pushed options chunk {i+1} to {min(i+80, len(options))}")

    print("ALL QUESTIONS & OPTIONS SUCCESSFULLY SYNCED TO SUPABASE!")

if __name__ == "__main__":
    push_data()
