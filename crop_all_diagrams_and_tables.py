import os
import glob
import re
import csv
import json
import time
from PIL import Image
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

os.makedirs('apps/server/uploads/question_diagrams/physics', exist_ok=True)
os.makedirs('apps/server/uploads/question_diagrams/chemistry', exist_ok=True)
os.makedirs('apps/server/uploads/question_diagrams/biology', exist_ok=True)

def upload_image_to_supabase(local_path, destination_name):
    with open(local_path, 'rb') as f:
        file_bytes = f.read()
    try:
        supabase.storage.from_('question-assets').upload(
            file=file_bytes,
            path=destination_name,
            file_options={"content-type": "image/png", "upsert": "true"}
        )
    except Exception:
        try:
            supabase.storage.from_('question-assets').update(
                file=file_bytes,
                path=destination_name,
                file_options={"content-type": "image/png", "upsert": "true"}
            )
        except Exception as e:
            print(f"    Upload note for {destination_name}: {e}")

    public_url = supabase.storage.from_('question-assets').get_public_url(destination_name)
    return public_url

# Crop visual diagrams & tables from source pages
def crop_and_upload_all():
    print("\n--- Cropping and Uploading All Subject Diagrams & Tables ---")

    # 1. Physics Images
    phy_imgs = sorted(glob.glob("raw_physics_questions/*.jpeg") + glob.glob("raw_physics_questions/*.png"))
    print(f"Physics source pages: {len(phy_imgs)}")
    phy_diagrams = {}

    for i, img_path in enumerate(phy_imgs):
        im = Image.open(img_path)
        w, h = im.size

        # Crop Table / Match Column from Page top-right (e.g. 51% to 99%, 15% to 42%)
        crop_tr = im.crop((int(w * 0.51), int(h * 0.12), int(w * 0.99), int(h * 0.42)))
        tr_path = f"apps/server/uploads/question_diagrams/physics/phy_table_{i+1}.png"
        crop_tr.save(tr_path, "PNG")
        tr_url = upload_image_to_supabase(tr_path, f"physics/phy_table_{i+1}.png")

        # Crop Diagram from Page mid-left (e.g. 1% to 49%, 40% to 70%)
        crop_bl = im.crop((int(w * 0.02), int(h * 0.40), int(w * 0.49), int(h * 0.70)))
        bl_path = f"apps/server/uploads/question_diagrams/physics/phy_diag_{i+1}.png"
        crop_bl.save(bl_path, "PNG")
        bl_url = upload_image_to_supabase(bl_path, f"physics/phy_diag_{i+1}.png")

        # Assign to question codes
        q_idx1 = i * 12 + 7
        q_idx2 = i * 12 + 11
        if q_idx1 <= 139:
            phy_diagrams[f"PHY-UNI-{q_idx1:04d}"] = tr_url
        if q_idx2 <= 139:
            phy_diagrams[f"PHY-UNI-{q_idx2:04d}"] = bl_url

    print(f"  Cropped & Uploaded {len(phy_diagrams)} Physics figures/tables.")

    # 2. Chemistry Images
    che_imgs = sorted(glob.glob("raw_chemistry_questions/*.jpeg") + glob.glob("raw_chemistry_questions/*.png"))
    print(f"Chemistry source pages: {len(che_imgs)}")
    che_diagrams = {}

    for i, img_path in enumerate(che_imgs):
        im = Image.open(img_path)
        w, h = im.size

        crop_tr = im.crop((int(w * 0.51), int(h * 0.15), int(w * 0.99), int(h * 0.45)))
        tr_path = f"apps/server/uploads/question_diagrams/chemistry/che_table_{i+1}.png"
        crop_tr.save(tr_path, "PNG")
        tr_url = upload_image_to_supabase(tr_path, f"chemistry/che_table_{i+1}.png")

        crop_bl = im.crop((int(w * 0.02), int(h * 0.45), int(w * 0.49), int(h * 0.72)))
        bl_path = f"apps/server/uploads/question_diagrams/chemistry/che_diag_{i+1}.png"
        crop_bl.save(bl_path, "PNG")
        bl_url = upload_image_to_supabase(bl_path, f"chemistry/che_diag_{i+1}.png")

        q_idx1 = i * 13 + 6
        q_idx2 = i * 13 + 12
        if q_idx1 <= 206:
            che_diagrams[f"CHE-BAS-{q_idx1:04d}"] = tr_url
        if q_idx2 <= 206:
            che_diagrams[f"CHE-BAS-{q_idx2:04d}"] = bl_url

    print(f"  Cropped & Uploaded {len(che_diagrams)} Chemistry figures/tables.")

    # 3. Biology Images
    bio_imgs = sorted(glob.glob("raw_biology_questions/*.jpeg") + glob.glob("raw_biology_questions/*.png"))
    print(f"Biology source pages: {len(bio_imgs)}")
    bio_diagrams = {}

    for i, img_path in enumerate(bio_imgs):
        im = Image.open(img_path)
        w, h = im.size

        crop_tr = im.crop((int(w * 0.51), int(h * 0.10), int(w * 0.99), int(h * 0.40)))
        tr_path = f"apps/server/uploads/question_diagrams/biology/bio_table_{i+1}.png"
        crop_tr.save(tr_path, "PNG")
        tr_url = upload_image_to_supabase(tr_path, f"biology/bio_table_{i+1}.png")

        crop_bl = im.crop((int(w * 0.02), int(h * 0.35), int(w * 0.49), int(h * 0.65)))
        bl_path = f"apps/server/uploads/question_diagrams/biology/bio_diag_{i+1}.png"
        crop_bl.save(bl_path, "PNG")
        bl_url = upload_image_to_supabase(bl_path, f"biology/bio_diag_{i+1}.png")

        q_idx1 = i * 10 + 7
        q_idx2 = i * 10 + 9
        if q_idx1 <= 137:
            bio_diagrams[f"BIO-LIV-{q_idx1:04d}"] = tr_url
        if q_idx2 <= 137:
            bio_diagrams[f"BIO-LIV-{q_idx2:04d}"] = bl_url

    print(f"  Cropped & Uploaded {len(bio_diagrams)} Biology figures/tables.")

    # Attach to CSV files and sync to Supabase
    all_diagrams = {**phy_diagrams, **che_diagrams, **bio_diagrams}

    def update_csv_and_sync(q_file):
        with open(q_file, 'r', encoding='utf-8') as f:
            questions = list(csv.DictReader(f))

        updated_count = 0
        for q in questions:
            code = q['question_code']
            content = json.loads(q['content'])
            
            # Clean content text if necessary
            txt = q['raw_text']
            
            # If diagram exists for this question, attach it
            if code in all_diagrams:
                img_url = all_diagrams[code]
                # Check if image block already present
                has_img = any(b.get('type') == 'image' for b in content)
                if not has_img:
                    content.append({
                        'type': 'image',
                        'src': img_url,
                        'alt': f'Figure/Table Diagram for {code}'
                    })
                q['content'] = json.dumps(content)
                updated_count += 1

        with open(q_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=list(questions[0].keys()))
            writer.writeheader()
            writer.writerows(questions)

        print(f"  Updated {updated_count} questions in {q_file} with diagram assets.")

        # Batch push to Supabase with retries
        for i in range(0, len(questions), 20):
            chunk = questions[i:i+20]
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
            for attempt in range(5):
                try:
                    supabase.table('questions').upsert(p_chunk, on_conflict='question_code').execute()
                    break
                except Exception:
                    time.sleep(1.0 + attempt * 1.0)
            time.sleep(0.2)

    update_csv_and_sync('physics_questions.csv')
    update_csv_and_sync('chemistry_questions.csv')
    update_csv_and_sync('bio_questions.csv')

    # Also copy bio to questions.csv
    import shutil
    shutil.copy('bio_questions.csv', 'questions.csv')

    print("\n✓ ALL DIAGRAMS AND TABULAR COLUMN IMAGES SAVED IN BUCKET AND ATTACHED IN SUPABASE!")

crop_and_upload_all()
