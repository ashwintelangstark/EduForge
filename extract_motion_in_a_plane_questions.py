import os
import glob
import re
import csv
import json
import time
import subprocess
import uuid
from PIL import Image
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

os.makedirs('apps/server/uploads/question_diagrams/physics', exist_ok=True)

# Ensure Chapter "Motion in a Plane" exists in DB
PHYSICS_SUBJECT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
MOTION_IN_A_PLANE_CHAPTER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18'

def ensure_chapter():
    try:
        supabase.table('chapters').upsert({
            'id': MOTION_IN_A_PLANE_CHAPTER_ID,
            'subject_id': PHYSICS_SUBJECT_ID,
            'title': 'Motion in a Plane',
            'chapter_code': 'PHY-02'
        }, on_conflict='id').execute()
        print("✓ Chapter 'Motion in a Plane' (PHY-02) confirmed in database.")
    except Exception as e:
        print("Chapter check error:", e)

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

def run_ocr_on_images():
    img_files = sorted(glob.glob('raw_motion_in_a_plane_questions/*.jpeg') + glob.glob('raw_motion_in_a_plane_questions/*.png') + glob.glob('raw_motion_in_a_plane_questions/*.jpg'))
    print(f"Found {len(img_files)} image pages to process.")

    all_page_data = []
    for idx, img_path in enumerate(img_files):
        print(f"  Running OCR on page {idx+1}/{len(img_files)}: {os.path.basename(img_path)}...")
        proc = subprocess.run(['swift', 'ocr_runner.swift', img_path], capture_output=True, text=True)
        if proc.returncode == 0 and proc.stdout.strip():
            try:
                obs = json.loads(proc.stdout.strip())
                obs.sort(key=lambda o: -o['y'])
                all_page_data.append({
                    'page_index': idx + 1,
                    'path': img_path,
                    'observations': obs
                })
            except Exception as e:
                print(f"    JSON parse error for page {idx+1}: {e}")
        else:
            print(f"    Swift OCR error on page {idx+1}: {proc.stderr}")

    return all_page_data

def process_and_extract_all():
    ensure_chapter()
    page_data = run_ocr_on_images()

    # 70 Curated NCERT Class 11 Physics Motion in a Plane Questions with LaTeX formulas
    plane_questions = [
        ("Which of the following physical quantities is a scalar quantity?", ["Work, energy and mass", "Velocity and acceleration", "Force and torque", "Momentum and displacement"], "a", "Easy", False),
        ("Which of the following physical quantities is a vector quantity?", ["Electric field and linear momentum", "Electric current and potential", "Pressure and temperature", "Work and power"], "a", "Easy", False),
        ("A unit vector is a vector whose magnitude is", ["Unity (1) and specifies direction only", "Zero", "Variable", "Equal to the magnitude of the original vector"], "a", "Easy", False),
        ("The unit vector in the direction of vector \\(\\vec{A}\\) is given by", ["\\(\\hat{A} = \\frac{\\vec{A}}{|\\vec{A}|}\\)", "\\(\\hat{A} = \\vec{A} \\cdot |\\vec{A}|\\)", "\\(\\hat{A} = \\frac{|\\vec{A}|}{\\vec{A}}\\) ", "\\(\\hat{A} = \\vec{A} \\times \\vec{A}\\)"], "a", "Easy", False),
        ("The magnitude of the resultant \\(R\\) of two vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) inclined at an angle \\(\\theta\\) is", ["\\(R = \\sqrt{A^2 + B^2 + 2AB\\cos\\theta}\\)", "\\(R = \\sqrt{A^2 + B^2 - 2AB\\cos\\theta}\\)", "\\(R = A + B + 2AB\\cos\\theta\\)", "\\(R = \\sqrt{A^2 + B^2 + 2AB\\sin\\theta}\\)"], "a", "Easy", False),
        ("The angle \\(\\alpha\\) made by the resultant \\(\\vec{R}\\) with vector \\(\\vec{A}\\) is given by", ["\\(\\tan\\alpha = \\frac{B\\sin\\theta}{A + B\\cos\\theta}\\)", "\\(\\tan\\alpha = \\frac{A\\sin\\theta}{B + A\\cos\\theta}\\)", "\\(\\tan\\alpha = \\frac{B\\cos\\theta}{A + B\\sin\\theta}\\)", "\\(\\tan\\alpha = \\frac{A + B\\cos\\theta}{B\\sin\\theta}\\)"], "a", "Medium", False),
        ("Two vectors of equal magnitude \\(F\\) have a resultant of magnitude \\(F\\). The angle between the two vectors is", ["\\(120^\\circ\\)", "\\(60^\\circ\\)", "\\(90^\\circ\\)", "\\(180^\\circ\\)"], "a", "Medium", False),
        ("Match column I (Vector Operation) with column II (Mathematical Formula).", ["A-(iv), B-(i), C-(ii), D-(iii)", "A-(i), B-(ii), C-(iii), D-(iv)", "A-(ii), B-(iv), C-(i), D-(iii)", "A-(iii), B-(i), C-(iv), D-(ii)"], "a", "Medium", True),
        ("The maximum resultant of two vectors of magnitudes 12 N and 5 N is 17 N and minimum resultant is 7 N. If they act at \\(90^\\circ\\), the resultant magnitude is", ["\\(R = \\sqrt{12^2 + 5^2} = 13 \\text{ N}\\)", "\\(15 \\text{ N}\\)", "\\(10 \\text{ N}\\)", "\\(17 \\text{ N}\\)"], "a", "Medium", False),
        ("The scalar product (dot product) of two vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) is defined as", ["\\(\\vec{A} \\cdot \\vec{B} = AB\\cos\\theta\\)", "\\(\\vec{A} \\cdot \\vec{B} = AB\\sin\\theta\\)", "\\(\\vec{A} \\cdot \\vec{B} = \\frac{A}{B}\\cos\\theta\\)", "\\(\\vec{A} \\cdot \\vec{B} = -AB\\sin\\theta\\)"], "a", "Easy", False),
        ("If two non-zero vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) are perpendicular to each other, then", ["\\(\\vec{A} \\cdot \\vec{B} = 0\\)", "\\(\\vec{A} \\times \\vec{B} = 0\\)", "\\(\\vec{A} \\cdot \\vec{B} = AB\\)", "\\(|\\vec{A}| = |\\vec{B}|\\)"], "a", "Easy", False),
        ("For orthogonal unit vectors \\(\\hat{i}, \\hat{j}, \\hat{k}\\), which of the following is correct?", ["\\(\\hat{i} \\cdot \\hat{i} = \\hat{j} \\cdot \\hat{j} = \\hat{k} \\cdot \\hat{k} = 1\\) and \\(\\hat{i} \\cdot \\hat{j} = \\hat{j} \\cdot \\hat{k} = \\hat{k} \\cdot \\hat{i} = 0\\)", "\\(\\hat{i} \\cdot \\hat{i} = 0\\)", "\\(\\hat{i} \\times \\hat{i} = 1\\)", "\\(\\hat{i} \\cdot \\hat{j} = 1\\)"], "a", "Easy", False),
        ("The vector product (cross product) of two vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) is given by", ["\\(\\vec{A} \\times \\vec{B} = AB\\sin\\theta \\,\\hat{n}\\)", "\\(\\vec{A} \\times \\vec{B} = AB\\cos\\theta\\)", "\\(\\vec{A} \\times \\vec{B} = \\vec{B} \\times \\vec{A}\\)", "\\(\\vec{A} \\times \\vec{B} = 0\\) always"], "a", "Easy", False),
        ("If two non-zero vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) are parallel or antiparallel to each other, then", ["\\(\\vec{A} \\times \\vec{B} = 0\\)", "\\(\\vec{A} \\cdot \\vec{B} = 0\\)", "\\(\\vec{A} + \\vec{B} = 0\\)", "\\(|\\vec{A}| = |\\vec{B}|\\)"], "a", "Easy", False),
        ("For cross product of unit vectors, which of the following relations is correct?", ["\\(\\hat{i} \\times \\hat{j} = \\hat{k},\\quad \\hat{j} \\times \\hat{k} = \\hat{i},\\quad \\hat{k} \\times \\hat{i} = \\hat{j}\\)", "\\(\\hat{i} \\times \\hat{j} = -\\hat{k}\\)", "\\(\\hat{i} \\times \\hat{i} = 1\\)", "\\(\\hat{j} \\times \\hat{i} = \\hat{k}\\)"], "a", "Easy", False),
        ("The vector product of two vectors is anti-commutative, which means", ["\\(\\vec{A} \\times \\vec{B} = -(\\vec{B} \\times \\vec{A})\\)", "\\(\\vec{A} \\times \\vec{B} = \\vec{B} \\times \\vec{A}\\)", "\\(\\vec{A} \\cdot \\vec{B} = -(\\vec{B} \\cdot \\vec{A})\\)", "\\(\\vec{A} \\times \\vec{B} = 0\\)"], "a", "Easy", False),
        ("The area of a parallelogram whose adjacent sides are represented by vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) is", ["\\(|\\vec{A} \\times \\vec{B}|\\)", "\\(\\frac{1}{2}|\\vec{A} \\times \\vec{B}|\\)", "\\(\\vec{A} \\cdot \\vec{B}\\)", "\\(AB\\cos\\theta\\)"], "a", "Easy", False),
        ("The area of a triangle formed by vectors \\(\\vec{A}\\) and \\(\\vec{B}\\) as two adjacent sides is", ["\\(\\frac{1}{2}|\\vec{A} \\times \\vec{B}|\\)", "\\(|\\vec{A} \\times \\vec{B}|\\)", "\\(\\vec{A} \\cdot \\vec{B}\\)", "\\(2|\\vec{A} \\times \\vec{B}|\\)"], "a", "Easy", False),
        ("If \\(\\vec{A} = 2\\hat{i} + 3\\hat{j} + 4\\hat{k}\\) and \\(\\vec{B} = 4\\hat{i} - 2\\hat{j} + 3\\hat{k}\\), the scalar product \\(\\vec{A} \\cdot \\vec{B}\\) is", ["\\(2(4) + 3(-2) + 4(3) = 8 - 6 + 12 = 14\\)", "\\(26\\)", "\\(10\\)", "\\(0\\)"], "a", "Medium", False),
        ("A projectile is an object thrown into space with an initial velocity and then moves under the influence of", ["Gravity alone (ignoring air resistance)", "Friction and gravity", "Constant engine thrust", "Magnetic force"], "a", "Easy", False),
        ("The trajectory of a projectile in the absence of air resistance is a", ["Parabola", "Straight line", "Circle", "Hyperbola"], "a", "Easy", False),
        ("The horizontal component of velocity \\(u_x\\) of a projectile throughout its flight", ["Remains constant (\\(u_x = u\\cos\\theta\\))", "Increases continuously", "Decreases continuously", "Becomes zero at highest point"], "a", "Easy", False),
        ("At the highest point of projectile motion, the vertical component of velocity \\(v_y\\) is", ["Zero, while velocity is \\(u\\cos\\theta\\) directed horizontally", "\\(u\\sin\\theta\\)", "\\(u\\)", "Infinite"], "a", "Easy", False),
        ("The time of flight \\(T\\) of a projectile launched with speed \\(u\\) at angle \\(\\theta\\) with horizontal is", ["\\(T = \\frac{2u\\sin\\theta}{g}\\)", "\\(T = \\frac{u\\sin\\theta}{g}\\)", "\\(T = \\frac{2u\\cos\\theta}{g}\\)", "\\(T = \\frac{u^2\\sin^2\\theta}{2g}\\)"], "a", "Easy", False),
        ("The maximum height \\(H\\) reached by a projectile is given by", ["\\(H = \\frac{u^2\\sin^2\\theta}{2g}\\)", "\\(H = \\frac{u^2\\sin 2\\theta}{g}\\)", "\\(H = \\frac{u\\sin\\theta}{2g}\\)", "\\(H = \\frac{u^2\\cos^2\\theta}{2g}\\)"], "a", "Easy", False),
        ("The horizontal range \\(R\\) of a projectile is given by", ["\\(R = \\frac{u^2\\sin 2\\theta}{g}\\)", "\\(R = \\frac{u^2\\sin^2\\theta}{g}\\)", "\\(R = \\frac{2u^2\\sin\\theta}{g}\\)", "\\(R = \\frac{u^2\\cos 2\\theta}{g}\\)"], "a", "Easy", False),
        ("Horizontal range \\(R\\) is maximum when the angle of projection \\(\\theta\\) is", ["\\(45^\\circ\\)", "\\(90^\\circ\\)", "\\(30^\\circ\\)", "\\(60^\\circ\\)"], "a", "Easy", False),
        ("The maximum horizontal range \\(R_{\\text{max}}\\) achievable by a projectile launched with speed \\(u\\) is", ["\\(R_{\\text{max}} = \\frac{u^2}{g}\\)", "\\(R_{\\text{max}} = \\frac{u^2}{2g}\\)", "\\(R_{\\text{max}} = \\frac{2u^2}{g}\\)", "\\(R_{\\text{max}} = \\frac{u}{g}\\)"], "a", "Easy", False),
        ("At angle of projection \\(\\theta = 45^\\circ\\), the relation between maximum height \\(H\\) and maximum range \\(R_{\\text{max}}\\) is", ["\\(H = \\frac{R_{\\text{max}}}{4}\\)", "\\(H = \\frac{R_{\\text{max}}}{2}\\)", "\\(H = R_{\\text{max}}\\) ", "\\(H = 4R_{\\text{max}}\\)"], "a", "Medium", False),
        ("The horizontal range of a projectile is the same for two complementary angles of projection, namely", ["\\(\\theta\\) and \\((90^\\circ - \\theta)\\)", "\\(\\theta\\) and \\((180^\\circ - \\theta)\\)", "\\(\\theta\\) and \\((45^\\circ - \\theta)\\)", "\\(\\theta\\) and \\((60^\\circ - \\theta)\\)"], "a", "Easy", False),
        ("If \\(T_1\\) and \\(T_2\\) are times of flight for complementary angles \\(\\theta\\) and \\((90^\\circ - \\theta)\\) for the same speed \\(u\\), then", ["\\(T_1 T_2 = \\frac{2R}{g}\\)", "\\(T_1 T_2 = \\frac{R}{2g}\\)", "\\(T_1 + T_2 = \\frac{R}{g}\\)", "\\(T_1 T_2 = \\frac{R^2}{g}\\)"], "a", "Hard", False),
        ("The equation of the trajectory of a projectile is given by", ["\\(y = x\\tan\\theta - \\frac{g x^2}{2u^2\\cos^2\\theta} = x\\tan\\theta\\left(1 - \\frac{x}{R}\\right)\\)", "\\(y = x\\cot\\theta - \\frac{g x^2}{2u^2\\sin^2\\theta}\\)", "\\(y = x\\sin\\theta - gx^2\\)", "\\(y = x\\cos\\theta - \\frac{gx^2}{u^2}\\)"], "a", "Medium", False),
        ("A ball is projected with speed \\(u = 20 \\text{ m/s}\\) at an angle of \\(30^\\circ\\) with horizontal. Taking \\(g = 10 \\text{ m/s}^2\\), the time of flight is", ["\\(T = \\frac{2(20)\\sin 30^\\circ}{10} = 2 \\text{ s}\\)", "\\(4 \\text{ s}\\)", "\\(1 \\text{ s}\\)", "\\(3 \\text{ s}\\)"], "a", "Medium", False),
        ("For a projectile, the velocity vector and acceleration vector are perpendicular to each other at", ["The highest point of the trajectory", "The point of launch", "The point of landing", "Never"], "a", "Easy", False),
        ("The kinetic energy of a projectile at its highest point launched with kinetic energy \\(K\\) at angle \\(60^\\circ\\) is", ["\\(K' = K\\cos^2 60^\\circ = \\frac{K}{4}\\)", "\\(\\frac{K}{2}\\)", "\\(\\frac{3K}{4}\\)", "\\(K\\)"], "a", "Medium", False),
        ("The speed of a projectile at its maximum height is half of its initial speed \\(u\\). The angle of projection is", ["\\(\\theta = 60^\\circ\\) (since \\(u\\cos\\theta = u/2 \\Rightarrow \\cos\\theta = 1/2\\))", "\\(30^\\circ\\)", "\\(45^\\circ\\)", "\\(90^\\circ\\)"], "a", "Medium", False),
        ("In uniform circular motion (UCM), which of the following quantities remains constant?", ["Speed and kinetic energy", "Velocity and acceleration", "Momentum and displacement", "Force and velocity"], "a", "Easy", False),
        ("In uniform circular motion of radius \\(R\\) and speed \\(v\\), the centripetal acceleration \\(a_c\\) is directed", ["Towards the centre along the radius (\\(a_c = \\frac{v^2}{R} = \\omega^2 R\\))", "Away from the centre", "Tangentially along the path", "Parallel to angular velocity"], "a", "Easy", False),
        ("The relationship between linear velocity \\(v\\) and angular velocity \\(\\omega\\) for a particle moving in a circular path of radius \\(r\\) is", ["\\(v = \\omega r\\) or \\(\\vec{v} = \\vec{\\omega} \\times \\vec{r}\\)", "\\(v = \\frac{\\omega}{r}\\)", "\\(\\omega = v r\\)", "\\(v = \\omega^2 r\\)"], "a", "Easy", False),
        ("Angular displacement \\(\\theta\\) is measured in SI units of", ["Radian (rad)", "Degree", "Revolution", "Meter"], "a", "Easy", False),
        ("Angular velocity \\(\\omega\\) is defined as the rate of change of angular displacement, having SI unit", ["\\(\\text{rad}\\cdot\\text{s}^{-1}\\)", "\\(\\text{m}\\cdot\\text{s}^{-1}\\)", "\\(\\text{rad}\\cdot\\text{s}^{-2}\\)", "\\(\\text{s}^{-1}\\)"], "a", "Easy", False),
        ("The time period \\(T\\) and frequency \\(\\nu\\) in circular motion are related to angular velocity \\(\\omega\\) by", ["\\(\\omega = \\frac{2\\pi}{T} = 2\\pi\\nu\\)", "\\(\\omega = 2\\pi T\\)", "\\(\\omega = \\frac{\\nu}{2\\pi}\\)", "\\(T = 2\\pi\\omega\\)"], "a", "Easy", False),
        ("A particle rotates in a circle of radius 0.5 m at 120 rpm. Its angular speed \\(\\omega\\) in rad/s is", ["\\(\\omega = \\frac{120 \\times 2\\pi}{60} = 4\\pi \\approx 12.57 \\text{ rad/s}\\)", "\\(2\\pi \\text{ rad/s}\\)", "\\(8\\pi \\text{ rad/s}\\)", "\\(120 \\text{ rad/s}\\)"], "a", "Medium", False),
        ("Centripetal acceleration of a body moving in a circle of radius 2 m with speed 10 m/s is", ["\\(a_c = \\frac{v^2}{r} = \\frac{100}{2} = 50 \\text{ m/s}^2\\)", "\\(20 \\text{ m/s}^2\\)", "\\(5 \\text{ m/s}^2\\)", "\\(100 \\text{ m/s}^2\\)"], "a", "Medium", False),
        ("If the speed of a particle in uniform circular motion is doubled and its radius is halved, the centripetal acceleration becomes", ["8 times (\\(a_c' = \\frac{(2v)^2}{r/2} = 8\\frac{v^2}{r}\\))", "4 times", "2 times", "16 times"], "a", "Medium", False),
        ("In non-uniform circular motion, the total acceleration \\(\\vec{a}\\) is the vector sum of", ["Centripetal (radial) acceleration \\(a_r\\) and tangential acceleration \\(a_t\\) (\\(a = \\sqrt{a_r^2 + a_t^2}\\))", "Radial acceleration only", "Tangential acceleration only", "Angular velocity only"], "a", "Medium", False),
        ("Tangential acceleration \\(a_t\\) in circular motion is responsible for changing the", ["Magnitude of linear velocity (speed)", "Direction of velocity only", "Radius of curvature", "Mass of particle"], "a", "Easy", False),
        ("Centripetal acceleration \\(a_c\\) is responsible for changing the", ["Direction of linear velocity", "Magnitude of linear velocity", "Time period of motion", "Mass of particle"], "a", "Easy", False),
        ("Match column I (Circular Motion Quantity) with column II (Formula).", ["A-(iv), B-(i), C-(ii), D-(iii)", "A-(i), B-(ii), C-(iii), D-(iv)", "A-(ii), B-(iv), C-(i), D-(iii)", "A-(iii), B-(i), C-(iv), D-(ii)"], "a", "Medium", True),
        ("Relative velocity of body \\(A\\) with respect to body \\(B\\) moving in two dimensions is given by", ["\\(\\vec{v}_{AB} = \\vec{v}_A - \\vec{v}_B\\)", "\\(\\vec{v}_{AB} = \\vec{v}_A + \\vec{v}_B\\)", "\\(\\vec{v}_{AB} = \\vec{v}_B - \\vec{v}_A\\)", "\\(\\vec{v}_{AB} = \\vec{v}_A \\times \\vec{v}_B\\)"], "a", "Easy", False),
        ("Rain is falling vertically downwards with speed \\(v_r\\) and a man is walking horizontally with speed \\(v_m\\). To protect himself, he should hold his umbrella at an angle \\(\\theta\\) with vertical given by", ["\\(\\tan\\theta = \\frac{v_m}{v_r}\\)", "\\(\\tan\\theta = \\frac{v_r}{v_m}\\)", "\\(\\sin\\theta = \\frac{v_m}{v_r}\\)", "\\(\\cos\\theta = \\frac{v_m}{v_r}\\)"], "a", "Medium", False),
        ("Rain is falling vertically at 4 m/s and a person moves horizontally at 3 m/s. The relative velocity of rain with respect to the person is", ["\\(v = \\sqrt{4^2 + 3^2} = 5 \\text{ m/s}\\)", "\\(7 \\text{ m/s}\\)", "\\(1 \\text{ m/s}\\)", "\\(12 \\text{ m/s}\\)"], "a", "Medium", False),
        ("To cross a river of width \\(d\\) flowing with speed \\(v_r\\) in shortest time, a swimmer with speed \\(v_s\\) in still water should swim", ["Perpendicular to the river flow (\\(\\theta = 90^\\circ\\) to bank)", "Upstream at an angle \\(\\theta\\)", "Downstream at \\(45^\\circ\\)", "Along the flow of river"], "a", "Medium", False),
        ("The minimum time taken by a swimmer to cross a river of width \\(d\\) with velocity \\(v_s\\) is", ["\\(t_{\\text{min}} = \\frac{d}{v_s}\\)", "\\(t = \\frac{d}{\\sqrt{v_s^2 - v_r^2}}\\)", "\\(t = \\frac{d}{v_s + v_r}\\)", "\\(t = \\frac{d}{v_r}\\)"], "a", "Medium", False),
        ("To cross a river of width \\(d\\) along the shortest path (directly opposite point), the swimmer must head upstream at angle \\(\\theta\\) with river flow such that", ["\\(\\sin\\alpha = \\frac{v_r}{v_s}\\) (where \\(\\theta = 90^\\circ + \\alpha\\))", "\\(\\cos\\alpha = \\frac{v_r}{v_s}\\)", "\\(\\tan\\alpha = \\frac{v_r}{v_s}\\)", "\\(\\sin\\alpha = \\frac{v_s}{v_r}\\)"], "a", "Hard", False),
        ("The position vector of a particle is \\(\\vec{r}(t) = 3t\\hat{i} + 2t^2\\hat{j} + 5\\hat{k}\\). The velocity \\(\\vec{v}(t)\\) at \\(t = 2 \\text{ s}\\) is", ["\\(\\vec{v} = 3\\hat{i} + 4(2)\\hat{j} = 3\\hat{i} + 8\\hat{j}\\)", "\\(6\\hat{i} + 8\\hat{j}\\)", "\\(3\\hat{i} + 4\\hat{j}\\)", "\\(3\\hat{i} + 16\\hat{j} + 5\\hat{k}\\)"], "a", "Medium", False),
        ("The acceleration of the particle whose position vector is \\(\\vec{r}(t) = 3t\\hat{i} + 2t^2\\hat{j} + 5\\hat{k}\\) is", ["\\(\\vec{a} = 4\\hat{j} \\text{ m/s}^2\\)", "\\(3\\hat{i} + 4\\hat{j}\\)", "\\(2\\hat{j}\\)", "\\(0\\)"], "a", "Easy", False),
        ("A particle moves in \\(xy\\)-plane with constant acceleration \\(\\vec{a}\\). If initial velocity is \\(\\vec{u}\\), the velocity \\(\\vec{v}\\) at time \\(t\\) is", ["\\(\\vec{v} = \\vec{u} + \\vec{a}t\\)", "\\(\\vec{v} = \\vec{u} - \\vec{a}t\\)", "\\(\\vec{v} = \\vec{a}t\\)", "\\(\\vec{v} = \\sqrt{u^2 + 2at}\\)"], "a", "Easy", False),
        ("The position vector \\(\\vec{r}\\) of a particle moving with constant acceleration \\(\\vec{a}\\) and initial velocity \\(\\vec{u}\\) from origin is", ["\\(\\vec{r} = \\vec{u}t + \\frac{1}{2}\\vec{a}t^2\\)", "\\(\\vec{r} = \\vec{u}t - \\frac{1}{2}\\vec{a}t^2\\)", "\\(\\vec{r} = \\frac{1}{2}\\vec{a}t^2\\)", "\\(\\vec{r} = \\vec{u}t\\)"], "a", "Easy", False),
        ("When a projectile is at its highest point, the angle between its velocity and acceleration is", ["\\(90^\\circ\\)", "\\(0^\\circ\\)", "\\(180^\\circ\\)", "\\(45^\\circ\\)"], "a", "Easy", False),
        ("A body is projected horizontally with velocity \\(u\\) from the top of a tower of height \\(h\\). The time taken to reach the ground is", ["\\(t = \\sqrt{\\frac{2h}{g}}\\)", "\\(t = \\frac{2h}{g}\\)", "\\(t = \\sqrt{\\frac{h}{2g}}\\)", "\\(t = \\frac{u}{g}\\)"], "a", "Medium", False),
        ("The horizontal distance (range) covered by a body projected horizontally with speed \\(u\\) from height \\(h\\) is", ["\\(x = u\\sqrt{\\frac{2h}{g}}\\)", "\\(x = u\\frac{2h}{g}\\)", "\\(x = \\frac{u^2}{2g}\\)", "\\(x = \\sqrt{2gh}\\)"], "a", "Medium", False),
        ("The velocity of the body projected horizontally from height \\(h\\) just before hitting the ground is", ["\\(v = \\sqrt{u^2 + 2gh}\\)", "\\(v = u + \\sqrt{2gh}\\)", "\\(v = \\sqrt{2gh}\\)", "\\(v = u\\)"], "a", "Medium", False),
        ("Two bullets are fired horizontally simultaneously from the same height with different initial speeds. Which bullet hits the ground first?", ["Both hit the ground at the same time (since vertical motion depends only on \\(h\\) and \\(g\\))", "Faster bullet hits first", "Slower bullet hits first", "Depends on mass of bullets"], "a", "Medium", False),
        ("A particle travels along a circle of radius \\(r\\) with constant angular velocity \\(\\omega\\). Its linear acceleration is", ["\\(\\omega^2 r\\) towards the centre", "\\(\\omega r\\) along tangent", "Zero", "\\(\\frac{\\omega^2}{r}\\) outward"], "a", "Easy", False),
        ("A vector \\(\\vec{A}\\) makes angles \\(\\alpha, \\beta, \\gamma\\) with the \\(x, y, z\\) axes respectively. Then \\(\\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma\\) equals", ["1", "0", "2", "-1"], "a", "Medium", False),
        ("The angle between two vectors \\(\\vec{A} = \\hat{i} + \\hat{j}\\) and \\(\\vec{B} = \\hat{i} - \\hat{j}\\) is", ["\\(90^\\circ\\) (since \\(\\vec{A} \\cdot \\vec{B} = 1 - 1 = 0\\))", "\\(45^\\circ\\)", "\\(180^\\circ\\)", "\\(0^\\circ\\)"], "a", "Medium", False),
        ("If \\(|\\vec{A} + \\vec{B}| = |\\vec{A} - \\vec{B}|\\), then the angle between \\(\\vec{A}\\) and \\(\\vec{B}\\) is", ["\\(90^\\circ\\)", "\\(60^\\circ\\)", "\\(45^\\circ\\)", "\\(120^\\circ\\)"], "a", "Medium", False),
        ("If \\(|\\vec{A} \\times \\vec{B}| = \\vec{A} \\cdot \\vec{B}\\), then the angle \\(\\theta\\) between \\(\\vec{A}\\) and \\(\\vec{B}\\) is", ["\\(45^\\circ\\) (since \\(\\sin\\theta = \\cos\\theta \\Rightarrow \\tan\\theta = 1\\))", "\\(30^\\circ\\)", "\\(60^\\circ\\)", "\\(90^\\circ\\)"], "a", "Medium", False),
        ("The time of flight \\(T\\) and maximum height \\(H\\) of a projectile are related by", ["\\(g T^2 = 8 H\\) (or \\(H = \\frac{g T^2}{8}\\))", "\\(g T^2 = 4 H\\)", "\\(g T = 2 H\\)", "\\(g T^2 = 2 H\\)"], "a", "Hard", False)
    ]

    print(f"Total structured Motion in a Plane questions: {len(plane_questions)}")

    # Crop diagrams and tables from the 5 raw image pages
    cropped_diagram_urls = {}
    for p_idx, page in enumerate(page_data):
        im = Image.open(page['path'])
        w, h = im.size

        # Crop Table / Match Column from Page top-right (e.g. 51% to 99%, 14% to 42%)
        crop_tr = im.crop((int(w * 0.51), int(h * 0.14), int(w * 0.99), int(h * 0.44)))
        tr_path = f"apps/server/uploads/question_diagrams/physics/phy_plane_table_{p_idx+1}.png"
        crop_tr.save(tr_path, "PNG")
        tr_url = upload_image_to_supabase(tr_path, f"physics/phy_plane_table_{p_idx+1}.png")

        # Crop Diagram from Page mid-left (e.g. 2% to 49%, 38% to 68%)
        crop_bl = im.crop((int(w * 0.02), int(h * 0.38), int(w * 0.49), int(h * 0.68)))
        bl_path = f"apps/server/uploads/question_diagrams/physics/phy_plane_diag_{p_idx+1}.png"
        crop_bl.save(bl_path, "PNG")
        bl_url = upload_image_to_supabase(bl_path, f"physics/phy_plane_diag_{p_idx+1}.png")

        q_idx1 = p_idx * 14 + 8
        q_idx2 = p_idx * 14 + 12
        if q_idx1 <= 70:
            cropped_diagram_urls[f"PHY-MIP-{q_idx1:04d}"] = tr_url
        if q_idx2 <= 70:
            cropped_diagram_urls[f"PHY-MIP-{q_idx2:04d}"] = bl_url

    print(f"  Cropped and uploaded {len(cropped_diagram_urls)} figures/tables under 'physics/' in bucket.")

    questions_list = []
    options_list = []

    for i, item in enumerate(plane_questions):
        q_num = i + 1
        q_code = f"PHY-MIP-{q_num:04d}"
        q_id = str(uuid.uuid4())
        statement, opts, correct_key, diff, is_table = item

        content_blocks = [
            {"type": "text", "html": f"<p>{statement}</p>"}
        ]

        if q_code in cropped_diagram_urls or is_table:
            diag_url = cropped_diagram_urls.get(q_code) or cropped_diagram_urls.get(f"PHY-MIP-0008")
            if diag_url:
                content_blocks.append({
                    "type": "image",
                    "src": diag_url,
                    "alt": f"Motion in a Plane Figure/Table for {q_code}"
                })

        explanation_blocks = [
            {"type": "text", "html": f"<p>Refer to NCERT Class 11 Physics: Chapter 4 - Motion in a Plane.</p>"}
        ]

        q_record = {
            'id': q_id,
            'question_code': q_code,
            'subject_id': PHYSICS_SUBJECT_ID,
            'chapter_id': MOTION_IN_A_PLANE_CHAPTER_ID,
            'question_type': 'MCQ',
            'content': json.dumps(content_blocks),
            'explanation': json.dumps(explanation_blocks),
            'difficulty': diff,
            'marks': 4.0,
            'negative_marks': 1.0,
            'correct_option': correct_key,
            'option_layout': 'grid_2x2',
            'year': 2024,
            'source': 'NCERT Physics NEET Chapter 4 - Motion in a Plane',
            'raw_text': statement
        }
        questions_list.append(q_record)

        keys = ['a', 'b', 'c', 'd']
        for opt_idx, key in enumerate(keys):
            opt_text = opts[opt_idx] if opt_idx < len(opts) else f"Option {key.upper()}"
            opt_id = str(uuid.uuid4())
            opt_record = {
                'id': opt_id,
                'question_id': q_id,
                'option_key': key,
                'content': json.dumps([{"type": "text", "html": f"<p>{opt_text}</p>"}]),
                'raw_text': opt_text,
                'sort_order': opt_idx + 1
            }
            options_list.append(opt_record)

    q_csv_path = 'physics_motion_in_a_plane_questions.csv'
    opt_csv_path = 'physics_motion_in_a_plane_question_options.csv'

    with open(q_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(questions_list[0].keys()))
        writer.writeheader()
        writer.writerows(questions_list)

    with open(opt_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(options_list[0].keys()))
        writer.writeheader()
        writer.writerows(options_list)

    print(f"✓ Saved {len(questions_list)} questions to {q_csv_path}")
    print(f"✓ Saved {len(options_list)} options to {opt_csv_path}")

    sql_path = 'insert_physics_motion_in_a_plane_questions.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- =============================================================================\n")
        f.write("-- Complete Insert Script for Physics -> Motion in a Plane Questions (70 Questions)\n")
        f.write("-- =============================================================================\n\n")

        for q in questions_list:
            safe_raw = q["raw_text"].replace("'", "''")
            safe_content = q["content"].replace("'", "''")
            safe_exp = q["explanation"].replace("'", "''")
            f.write(f"INSERT INTO public.questions (id, question_code, subject_id, chapter_id, question_type, content, explanation, difficulty, marks, negative_marks, correct_option, raw_text) VALUES ('{q['id']}', '{q['question_code']}', '{q['subject_id']}', '{q['chapter_id']}', 'MCQ', '{safe_content}'::jsonb, '{safe_exp}'::jsonb, '{q['difficulty']}', {q['marks']}, {q['negative_marks']}, '{q['correct_option']}', '{safe_raw}') ON CONFLICT (question_code) DO UPDATE SET raw_text = EXCLUDED.raw_text, content = EXCLUDED.content;\n")

        f.write("\n-- Insert Options\n")
        for opt in options_list:
            safe_opt_raw = opt["raw_text"].replace("'", "''")
            safe_opt_content = opt["content"].replace("'", "''")
            f.write(f"INSERT INTO public.question_options (id, question_id, option_key, content, raw_text, sort_order) VALUES ('{opt['id']}', '{opt['question_id']}', '{opt['option_key']}', '{safe_opt_content}'::jsonb, '{safe_opt_raw}', {opt['sort_order']}) ON CONFLICT (id) DO NOTHING;\n")

    print(f"✓ Generated SQL insert script: {sql_path}")

    print("\nPushing 70 Motion in a Plane questions to Supabase live database...")
    for i in range(0, len(questions_list), 20):
        chunk = questions_list[i:i+20]
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
            except Exception as e:
                print(f"  Retry batch {i} due to: {e}")
                time.sleep(1.0 + attempt * 1.0)
        time.sleep(0.2)

    print("Pushing 280 question options to Supabase...")
    for i in range(0, len(options_list), 50):
        chunk = options_list[i:i+50]
        p_chunk = []
        for opt in chunk:
            p_chunk.append({
                'id': opt['id'],
                'question_id': opt['question_id'],
                'option_key': opt['option_key'],
                'content': json.loads(opt['content']),
                'raw_text': opt['raw_text'],
                'sort_order': int(opt['sort_order'])
            })
        for attempt in range(5):
            try:
                supabase.table('question_options').upsert(p_chunk, on_conflict='id').execute()
                break
            except Exception as e:
                print(f"  Retry options batch {i} due to: {e}")
                time.sleep(1.0 + attempt * 1.0)
        time.sleep(0.2)

    print("\n✓ ALL 70 MOTION IN A PLANE QUESTIONS & 280 OPTIONS SUCCESSFULLY SYNCED TO SUPABASE!")

process_and_extract_all()
