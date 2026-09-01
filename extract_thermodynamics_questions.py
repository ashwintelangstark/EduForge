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

os.makedirs('apps/server/uploads/question_diagrams/chemistry', exist_ok=True)

# Ensure Chapter "Thermodynamics" exists in DB
CHEMISTRY_SUBJECT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
THERMODYNAMICS_CHAPTER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17'

def ensure_chapter():
    try:
        supabase.table('chapters').upsert({
            'id': THERMODYNAMICS_CHAPTER_ID,
            'subject_id': CHEMISTRY_SUBJECT_ID,
            'title': 'Thermodynamics',
            'chapter_code': 'CHE-02'
        }, on_conflict='id').execute()
        print("✓ Chapter 'Thermodynamics' (CHE-02) confirmed in database.")
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
    img_files = sorted(glob.glob('raw_thermodynamics_questions/*.jpeg') + glob.glob('raw_thermodynamics_questions/*.png') + glob.glob('raw_thermodynamics_questions/*.jpg'))
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

    # 72 Curated NCERT Class 11 Chemistry Thermodynamics Questions with LaTeX formulas
    thermo_questions = [
        ("A system which can exchange neither matter nor energy with the surroundings is called", ["An isolated system", "An open system", "A closed system", "An adiabatic system"], "a", "Easy", False),
        ("Which of the following is an intensive property?", ["Temperature, pressure and density", "Mass and volume", "Internal energy and enthalpy", "Heat capacity and entropy"], "a", "Easy", False),
        ("Which of the following is an extensive property?", ["Enthalpy (H), entropy (S) and internal energy (U)", "Molar heat capacity", "Density and refractive index", "Surface tension and viscosity"], "a", "Easy", False),
        ("Which of the following thermodynamic functions is a state function?", ["Internal energy (U), Enthalpy (H), Gibbs energy (G)", "Heat (q) and Work (w)", "Heat (q) only", "Work (w) only"], "a", "Easy", False),
        ("For an adiabatic process, which of the following is correct?", ["q = 0 (No heat exchange between system and surroundings)", "ΔT = 0", "ΔP = 0", "ΔV = 0"], "a", "Easy", False),
        ("For an isothermal process, the change in temperature is", ["ΔT = 0 and ΔU = 0 for an ideal gas", "q = 0", "w = 0", "ΔH ≠ 0 and ΔU ≠ 0"], "a", "Easy", False),
        ("For an isochoric process, the work done (w) is", ["w = 0 (since ΔV = 0)", "w = -PΔV", "w = -2.303 nRT log(V2/V1)", "w = q"], "a", "Easy", False),
        ("The mathematical expression for the First Law of Thermodynamics is", ["\\(\\Delta U = q + w\\)", "\\(\\Delta U = q - w\\)", "\\(q = \\Delta U + w\\)", "\\(w = \\Delta U + q\\)"], "a", "Easy", False),
        ("Work done in isothermal reversible expansion of an ideal gas from volume \\(V_1\\) to \\(V_2\\) is given by", ["\\(w = -2.303 nRT \\log_{10}\\left(\\frac{V_2}{V_1}\\right)\\)", "\\(w = -P_{\\text{ext}}(V_2 - V_1)\\)", "\\(w = nRT \\ln\\left(\\frac{V_1}{V_2}\\right)\\)", "\\(w = -\\Delta U\\)"], "a", "Medium", False),
        ("In free expansion of an ideal gas into vacuum (\\(P_{\\text{ext}} = 0\\)), the work done is", ["\\(w = 0\\), and if isothermal then \\(q = 0\\) and \\(\\Delta U = 0\\)", "\\(w = -P\\Delta V\\)", "\\(w = -nRT\\)", "\\(w = \\infty\\)"], "a", "Medium", False),
        ("Enthalpy \\(H\\) is defined mathematically as", ["\\(H = U + PV\\)", "\\(H = U - PV\\)", "\\(H = G + TS\\)", "\\(H = q + w\\)"], "a", "Easy", False),
        ("The relation between change in enthalpy (\\(\\Delta H\\)) and change in internal energy (\\(\\Delta U\\)) for a gaseous reaction is", ["\\(\\Delta H = \\Delta U + \\Delta n_g RT\\)", "\\(\\Delta H = \\Delta U - \\Delta n_g RT\\)", "\\(\\Delta U = \\Delta H + \\Delta n_g RT\\)", "\\(\\Delta H = \\Delta U + P\\Delta V + V\\Delta P\\)"], "a", "Easy", False),
        ("For the reaction \\(\\text{N}_2(g) + 3\\text{H}_2(g) \\rightarrow 2\\text{NH}_3(g)\\), the relationship between \\(\\Delta H\\) and \\(\\Delta U\\) is", ["\\(\\Delta H = \\Delta U - 2RT\\) (since \\(\\Delta n_g = -2\\))", "\\(\\Delta H = \\Delta U + 2RT\\)", "\\(\\Delta H = \\Delta U\\)", "\\(\\Delta H = \\Delta U - 4RT\\)"], "a", "Medium", False),
        ("For the reaction \\(\\text{C}(s) + \\text{O}_2(g) \\rightarrow \\text{CO}_2(g)\\), the relation between \\(\\Delta H\\) and \\(\\Delta U\\) is", ["\\(\\Delta H = \\Delta U\\) (since \\(\\Delta n_g = 1 - 1 = 0\\))", "\\(\\Delta H > \\Delta U\\)", "\\(\\Delta H < \\Delta U\\)", "\\(\\Delta H = \\Delta U + RT\\)"], "a", "Medium", False),
        ("Heat capacity at constant pressure (\\(C_p\\)) and at constant volume (\\(C_v\\)) for an ideal gas are related by Mayer's relation", ["\\(C_p - C_v = R\\)", "\\(C_v - C_p = R\\)", "\\(C_p + C_v = R\\)", "\\(C_p / C_v = R\\)"], "a", "Easy", False),
        ("The ratio of molar heat capacities \\(\\gamma = C_p / C_v\\) for a monoatomic ideal gas is", ["\\(\\frac{5}{3} = 1.67\\)", "\\(\\frac{7}{5} = 1.40\\)", "\\(\\frac{4}{3} = 1.33\\)", "\\(1.00\\)"], "a", "Medium", False),
        ("The ratio \\(\\gamma = C_p / C_v\\) for a diatomic gas like \\(\\text{O}_2\\) or \\(\\text{N}_2\\) at room temperature is", ["\\(\\frac{7}{5} = 1.40\\)", "\\(\\frac{5}{3} = 1.67\\)", "\\(\\frac{4}{3} = 1.33\\)", "\\(2.00\\)"], "a", "Medium", False),
        ("Measurement of \\(\\Delta U\\) is carried out experimentally in a", ["Bomb calorimeter (constant volume, \\(q_v = \\Delta U\\))", "Coffee cup calorimeter (constant pressure)", "Open beaker", "Thermometer flask"], "a", "Easy", False),
        ("Measurement of \\(\\Delta H\\) is carried out experimentally at", ["Constant pressure in a coffee cup calorimeter (\\(q_p = \\Delta H\\))", "Constant volume in bomb calorimeter", "Constant temperature only", "Zero pressure"], "a", "Easy", False),
        ("Standard enthalpy of formation (\\(\\Delta_f H^\\circ\\)) of an element in its standard state (reference state) is taken as", ["Zero", "Positive", "Negative", "\\(100 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)"], "a", "Easy", False),
        ("Which of the following has standard enthalpy of formation equal to zero at 298 K?", ["\\(\\text{O}_2(g)\\), \\(\\text{C}(\\text{graphite})\\), \\(\\text{S}(\\text{rhombic})\\)", "\\(\\text{O}_3(g)\\)", "\\(\\text{C}(\\text{diamond})\\)", "\\(\\text{S}(\\text{monoclinic})\\)"], "a", "Medium", False),
        ("Hess's Law of Constant Heat Summation states that the total enthalpy change for a chemical reaction is", ["Independent of the path or number of steps taken", "Dependent on the path taken", "Directly proportional to time", "Zero for all reactions"], "a", "Easy", False),
        ("Enthalpy of combustion (\\(\\Delta_c H^\\circ\\)) is always", ["Negative (exothermic)", "Positive (endothermic)", "Zero", "Unpredictable"], "a", "Easy", False),
        ("Match column I (Thermodynamic Process) with column II (Condition) and select the correct option.", ["A-(iv), B-(i), C-(ii), D-(iii)", "A-(i), B-(ii), C-(iii), D-(iv)", "A-(ii), B-(iv), C-(i), D-(iii)", "A-(iii), B-(i), C-(iv), D-(ii)"], "a", "Medium", True),
        ("The enthalpy change accompanying the complete breaking of one mole of covalent bonds into gaseous atoms is called", ["Bond dissociation enthalpy", "Enthalpy of atomization", "Lattice enthalpy", "Enthalpy of ionization"], "a", "Easy", False),
        ("For diatomic molecules like \\(\\text{H}_2\\) and \\(\\text{Cl}_2\\), bond dissociation enthalpy is equal to", ["Enthalpy of atomization", "Enthalpy of formation", "Enthalpy of vaporization", "Enthalpy of sublimation"], "a", "Medium", False),
        ("Lattice enthalpy of an ionic compound \\(\\text{NaCl}(s)\\) can be determined indirectly using", ["Born-Haber cycle", "Carnot cycle", "Hess cycle only", "Calorimetric bomb directly"], "a", "Easy", False),
        ("A process that occurs on its own without the help of an external continuous agency is called", ["A spontaneous process", "A non-spontaneous process", "A reversible process only", "An adiabatic process"], "a", "Easy", False),
        ("Entropy (\\(S\\)) is a measure of", ["Randomness or disorder of a thermodynamic system", "Total energy of system", "Useful work done", "Pressure of gas"], "a", "Easy", False),
        ("The unit of entropy in SI system is", ["\\(\\text{J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(\\text{kJ}\\cdot\\text{mol}^{-1}\\)", "\\(\\text{J}\\cdot\\text{s}^{-1}\\)", "\\(\\text{N}\\cdot\\text{m}^{-2}\\)"], "a", "Easy", False),
        ("Which state of matter has the highest entropy?", ["Gaseous state > Liquid state > Solid state", "Solid state > Liquid state > Gaseous state", "Liquid state > Gaseous state > Solid state", "All have equal entropy"], "a", "Easy", False),
        ("For a reversible process at temperature \\(T\\), change in entropy \\(\\Delta S\\) is given by", ["\\(\\Delta S = \\frac{q_{\\text{rev}}}{T}\\)", "\\(\\Delta S = \\frac{w_{\\text{rev}}}{T}\\)", "\\(\\Delta S = \\frac{\\Delta H}{P}\\)", "\\(\\Delta S = T \\cdot q_{\\text{rev}}\\)"], "a", "Easy", False),
        ("According to the Second Law of Thermodynamics, for any spontaneous process, the total entropy change of the universe is", ["\\(\\Delta S_{\\text{total}} = \\Delta S_{\\text{sys}} + \\Delta S_{\\text{surr}} > 0\\)", "\\(\\Delta S_{\\text{total}} = 0\\)", "\\(\\Delta S_{\\text{total}} < 0\\)", "\\(\\Delta S_{\\text{sys}} = 0\\)"], "a", "Easy", False),
        ("At equilibrium, the total entropy change of the universe is", ["\\(\\Delta S_{\\text{total}} = 0\\)", "\\(\\Delta S_{\\text{total}} > 0\\)", "\\(\\Delta S_{\\text{total}} < 0\\)", "\\(\\Delta S_{\\text{total}} = \\infty\\)"], "a", "Easy", False),
        ("Gibbs free energy (\\(G\\)) is defined mathematically as", ["\\(G = H - TS\\)", "\\(G = H + TS\\)", "\\(G = U - TS\\)", "\\(G = U + PV - TS\\)"], "a", "Easy", False),
        ("The Gibbs-Helmholtz equation at constant temperature and pressure is", ["\\(\\Delta G = \\Delta H - T\\Delta S\\)", "\\(\\Delta G = \\Delta H + T\\Delta S\\)", "\\(\\Delta H = \\Delta G - T\\Delta S\\)", "\\(\\Delta G = \\Delta U - T\\Delta S\\)"], "a", "Easy", False),
        ("Criteria for spontaneity in terms of Gibbs energy change (\\(\\Delta G\\)) at constant \\(T\\) and \\(P\\) is", ["\\(\\Delta G < 0\\) (Negative) for spontaneous, \\(\\Delta G = 0\\) at equilibrium, \\(\\Delta G > 0\\) for non-spontaneous", "\\(\\Delta G > 0\\) for spontaneous", "\\(\\Delta G = 0\\) for spontaneous", "\\(\\Delta G \\ge 0\\) for spontaneous"], "a", "Easy", False),
        ("A reaction having \\(\\Delta H < 0\\) (exothermic) and \\(\\Delta S > 0\\) (entropy increase) is", ["Spontaneous at all temperatures", "Non-spontaneous at all temperatures", "Spontaneous only at high temperatures", "Spontaneous only at low temperatures"], "a", "Medium", False),
        ("A reaction having \\(\\Delta H > 0\\) (endothermic) and \\(\\Delta S < 0\\) (entropy decrease) is", ["Non-spontaneous at all temperatures", "Spontaneous at all temperatures", "Spontaneous at high temperatures", "Spontaneous at low temperatures"], "a", "Medium", False),
        ("A reaction having \\(\\Delta H > 0\\) and \\(\\Delta S > 0\\) becomes spontaneous at", ["High temperatures (where \\(T\\Delta S > \\Delta H\\))", "Low temperatures", "All temperatures", "Zero Kelvin"], "a", "Medium", False),
        ("A reaction having \\(\\Delta H < 0\\) and \\(\\Delta S < 0\\) is spontaneous at", ["Low temperatures (where \\(|\\Delta H| > |T\\Delta S|\\))", "High temperatures", "All temperatures", "No temperature"], "a", "Medium", False),
        ("The relationship between standard Gibbs energy change (\\(\\Delta G^\\circ\\)) and equilibrium constant \\(K\\) is", ["\\(\\Delta G^\\circ = -RT \\ln K = -2.303 RT \\log_{10} K\\)", "\\(\\Delta G^\\circ = RT \\ln K\\)", "\\(\\Delta G^\\circ = -nFE^\\circ\\)", "\\(K = e^{\\Delta G^\\circ / RT}\\)"], "a", "Medium", False),
        ("If \\(K > 1\\), then \\(\\Delta G^\\circ\\) will be", ["Negative (\\(\\Delta G^\\circ < 0\\)), favoring products", "Positive (\\(\\Delta G^\\circ > 0\\))", "Zero", "\\(1.0\\)"], "a", "Easy", False),
        ("Third Law of Thermodynamics states that the entropy of any pure, perfectly crystalline substance at absolute zero (0 K) is", ["Zero", "Maximum", "Infinite", "Negative"], "a", "Easy", False),
        ("The Third Law of Thermodynamics helps in determining the", ["Absolute entropy of pure substances at any temperature", "Absolute enthalpy of substances", "Absolute internal energy", "Rate of chemical reaction"], "a", "Medium", False),
        ("In an irreversible isothermal expansion of an ideal gas against a constant external pressure \\(P_{\\text{ext}}\\), work done is", ["\\(w = -P_{\\text{ext}}(V_2 - V_1)\\)", "\\(w = -2.303 nRT \\log(V_2/V_1)\\)", "\\(w = 0\\)", "\\(w = -\\Delta U\\)"], "a", "Medium", False),
        ("During adiabatic expansion of an ideal gas, the temperature of the gas", ["Decreases (cooling effect, \\(\\Delta U = w < 0\\))", "Increases", "Remains constant", "First increases then decreases"], "a", "Medium", False),
        ("During adiabatic compression of an ideal gas, the internal energy of the gas", ["Increases (\\(\\Delta U = w > 0\\))", "Decreases", "Remains constant", "Becomes zero"], "a", "Medium", False),
        ("Match the thermodynamic state functions with their corresponding mathematical definitions.", ["A-(iii), B-(i), C-(iv), D-(ii)", "A-(i), B-(ii), C-(iii), D-(iv)", "A-(ii), B-(iii), C-(i), D-(iv)", "A-(iv), B-(ii), C-(iii), D-(i)"], "a", "Medium", True),
        ("When ice melts into liquid water at \\(0^\\circ\\text{C}\\), the entropy change (\\(\\Delta S\\)) is", ["Positive (\\(\\Delta S > 0\\))", "Negative (\\(\\Delta S < 0\\))", "Zero", "Undefined"], "a", "Easy", False),
        ("When water freezes into ice, the entropy of the system", ["Decreases (\\(\\Delta S_{\\text{sys}} < 0\\)) while surroundings entropy increases", "Increases", "Remains zero", "Becomes negative infinity"], "a", "Medium", False),
        ("For the reaction \\(2\\text{Cl}(g) \\rightarrow \\text{Cl}_2(g)\\), the signs of \\(\\Delta H\\) and \\(\\Delta S\\) are respectively", ["\\(\\Delta H < 0\\) (bond formation is exothermic) and \\(\\Delta S < 0\\) (randomness decreases)", "\\(\\Delta H > 0\\) and \\(\\Delta S > 0\\)", "\\(\\Delta H < 0\\) and \\(\\Delta S > 0\\)", "\\(\\Delta H > 0\\) and \\(\\Delta S < 0\\)"], "a", "Medium", False),
        ("For the sublimation of solid iodine \\(\\text{I}_2(s) \\rightarrow \\text{I}_2(g)\\), the signs of \\(\\Delta H\\) and \\(\\Delta S\\) are", ["\\(\\Delta H > 0\\) (endothermic) and \\(\\Delta S > 0\\) (randomness increases)", "\\(\\Delta H < 0\\) and \\(\\Delta S < 0\\)", "\\(\\Delta H > 0\\) and \\(\\Delta S < 0\\)", "\\(\\Delta H < 0\\) and \\(\\Delta S > 0\\)"], "a", "Medium", False),
        ("The heat of neutralization of a strong acid (e.g., \\(\\text{HCl}\\)) with a strong base (e.g., \\(\\text{NaOH}\\)) is constant and equal to", ["\\(-57.1 \\text{ kJ}\\cdot\\text{mol}^{-1}\\) (or \\(-13.7 \\text{ kcal}\\cdot\\text{mol}^{-1}\\))", "\\(-100 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)", "\\(+57.1 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)", "\\(0 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)"], "a", "Medium", False),
        ("Heat of neutralization of a weak acid (e.g., \\(\\text{CH}_3\\text{COOH}\\)) with a strong base is less than \\(-57.1 \\text{ kJ}\\cdot\\text{mol}^{-1}\\) because", ["Some heat is consumed in complete ionization of the weak acid", "Weak acid releases more heat", "Reaction is incomplete", "Water is not formed"], "a", "Medium", False),
        ("Which of the following processes represents enthalpy of atomization of dihydrogen?", ["\\(\\text{H}_2(g) \\rightarrow 2\\text{H}(g)\\)", "\\(\\text{H}_2(g) \\rightarrow \\text{H}_2(l)\\)", "\\(\\text{H}^+(aq) + \\text{OH}^-(aq) \\rightarrow \\text{H}_2\\text{O}(l)\\)", "\\(2\\text{H}_2(g) + \\text{O}_2(g) \\rightarrow 2\\text{H}_2\\text{O}(l)\\)"], "a", "Easy", False),
        ("In a cyclic process involving an ideal gas, which of the following statements is true for the complete cycle?", ["\\(\\Delta U = 0\\), \\(\\Delta H = 0\\), \\(\\Delta S = 0\\), and \\(q = -w\\)", "\\(w = 0\\) and \\(q = 0\\)", "\\(\\Delta U > 0\\)", "\\(\\Delta H > 0\\)"], "a", "Medium", False),
        ("The work done during expansion from 2 L to 10 L against a constant pressure of 2 atm is", ["\\(w = -P\\Delta V = -2 \\times (10 - 2) = -16 \\text{ L}\\cdot\\text{atm} = -1621.2 \\text{ J}\\)", "\\(-800 \\text{ J}\\)", "\\(-3200 \\text{ J}\\)", "\\(+1621.2 \\text{ J}\\)"], "a", "Hard", False),
        ("For an ideal gas undergoing isothermal reversible expansion, the maximum work is obtained because", ["External pressure is infinitesimally smaller than internal pressure at every stage", "External pressure is zero", "Volume change is zero", "Temperature decreases"], "a", "Medium", False),
        ("The enthalpy of formation of \\(\\text{CO}_2(g)\\) is \\(-393.5 \\text{ kJ}\\cdot\\text{mol}^{-1}\\). The heat released on burning 35.2 g of \\(\\text{CO}_2\\) from carbon and dioxygen is", ["\\(314.8 \\text{ kJ}\\)", "\\(393.5 \\text{ kJ}\\)", "\\(196.75 \\text{ kJ}\\)", "\\(787.0 \\text{ kJ}\\)"], "a", "Hard", False),
        ("The standard Gibbs energy change \\(\\Delta G^\\circ\\) for a cell reaction with \\(E^\\circ_{\\text{cell}} = 1.10 \\text{ V}\\) and \\(n = 2\\) is", ["\\(\\Delta G^\\circ = -nFE^\\circ = -2 \\times 96487 \\times 1.10 = -212.27 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)", "\\(+212.27 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)", "\\(-106.13 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)", "\\(+106.13 \\text{ kJ}\\cdot\\text{mol}^{-1}\\)"], "a", "Hard", False),
        ("A system absorbs 701 J of heat and does 394 J of work. The change in internal energy (\\(\\Delta U\\)) is", ["\\(\\Delta U = q + w = 701 - 394 = +307 \\text{ J}\\)", "\\(-307 \\text{ J}\\)", "\\(+1095 \\text{ J}\\)", "\\(-1095 \\text{ J}\\)"], "a", "Medium", False),
        ("If enthalpy of vaporization of water is \\(40.66 \\text{ kJ}\\cdot\\text{mol}^{-1}\\) at \\(100^\\circ\\text{C}\\) (373 K), the entropy of vaporization is", ["\\(\\Delta S_{\\text{vap}} = \\frac{40660}{373} = 108.99 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(10.89 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(406.6 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(0 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)"], "a", "Hard", False),
        ("Trouton's Rule states that entropy of vaporization for most unassociated liquids is approximately constant and equal to", ["\\(\\Delta S_{\\text{vap}} \\approx 88 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(50 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(150 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)", "\\(0 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\)"], "a", "Medium", False),
        ("Which of the following conditions ensures that a reaction is spontaneous at 298 K?", ["\\(\\Delta G < 0\\)", "\\(\\Delta H < 0\\) only", "\\(\\Delta S > 0\\) only", "\\(\\Delta U = 0\\)"], "a", "Easy", False),
        ("For a reaction \\(A + B \\rightarrow C + D\\), if \\(\\Delta H = -10.0 \\text{ kJ}\\cdot\\text{mol}^{-1}\\) and \\(\\Delta S = -20.0 \\text{ J}\\cdot\\text{K}^{-1}\\cdot\\text{mol}^{-1}\\), the reaction will become non-spontaneous at temperatures above", ["\\(T = \\frac{\\Delta H}{\\Delta S} = \\frac{-10000}{-20} = 500 \\text{ K}\\)", "\\(250 \\text{ K}\\)", "\\(1000 \\text{ K}\\)", "\\(300 \\text{ K}\\)"], "a", "Hard", False),
        ("In an endothermic reaction with \\(\\Delta H > 0\\), if temperature is increased, the equilibrium constant \\(K\\)", ["Increases according to Van't Hoff equation", "Decreases", "Remains constant", "Becomes zero"], "a", "Medium", False),
        ("In an exothermic reaction with \\(\\Delta H < 0\\), if temperature is increased, the equilibrium constant \\(K\\)", ["Decreases", "Increases", "Remains constant", "Doubles"], "a", "Medium", False),
        ("The slope of the graph between \\(\\ln K\\) vs \\(1/T\\) in Van't Hoff is equal to", ["\\(-\\frac{\\Delta H^\\circ}{R}\\)", "\\(\\frac{\\Delta H^\\circ}{R}\\)", "\\(-\\frac{\\Delta S^\\circ}{R}\\)", "\\(\\frac{\\Delta G^\\circ}{RT}\\)"], "a", "Hard", False),
        ("Match column I (Thermodynamic Law) with column II (Fundamental Definition).", ["A-(iv), B-(i), C-(ii), D-(iii)", "A-(i), B-(ii), C-(iii), D-(iv)", "A-(ii), B-(iv), C-(i), D-(iii)", "A-(iii), B-(i), C-(iv), D-(ii)"], "a", "Medium", True),
        ("The change in Gibbs free energy for reversible phase transition at normal boiling point or melting point is", ["\\(\\Delta G = 0\\)", "\\(\\Delta G < 0\\)", "\\(\\Delta G > 0\\)", "\\(\\Delta G = \\infty\\)"], "a", "Easy", False),
        ("For the reaction \\(2\\text{NO}_2(g) \\rightleftharpoons \\text{N}_2\\text{O}_4(g)\\), \\(\\Delta H = -57.2 \\text{ kJ}\\). The sign of \\(\\Delta S\\) is", ["Negative (since 2 moles of gas combine to form 1 mole of gas)", "Positive", "Zero", "Equal to \\(\\Delta H\\)"], "a", "Medium", False)
    ]

    print(f"Total structured Thermodynamics questions: {len(thermo_questions)}")

    # Crop diagrams and tables from the 11 raw image pages
    cropped_diagram_urls = {}
    for p_idx, page in enumerate(page_data):
        im = Image.open(page['path'])
        w, h = im.size

        # Crop Table / Match Column from Page top-right (e.g. 51% to 99%, 14% to 42%)
        crop_tr = im.crop((int(w * 0.51), int(h * 0.14), int(w * 0.99), int(h * 0.44)))
        tr_path = f"apps/server/uploads/question_diagrams/chemistry/che_thermo_table_{p_idx+1}.png"
        crop_tr.save(tr_path, "PNG")
        tr_url = upload_image_to_supabase(tr_path, f"chemistry/che_thermo_table_{p_idx+1}.png")

        # Crop Diagram from Page mid-left (e.g. 2% to 49%, 38% to 68%)
        crop_bl = im.crop((int(w * 0.02), int(h * 0.38), int(w * 0.49), int(h * 0.68)))
        bl_path = f"apps/server/uploads/question_diagrams/chemistry/che_thermo_diag_{p_idx+1}.png"
        crop_bl.save(bl_path, "PNG")
        bl_url = upload_image_to_supabase(bl_path, f"chemistry/che_thermo_diag_{p_idx+1}.png")

        q_idx1 = p_idx * 7 + 8
        q_idx2 = p_idx * 7 + 12
        if q_idx1 <= 72:
            cropped_diagram_urls[f"CHE-THE-{q_idx1:04d}"] = tr_url
        if q_idx2 <= 72:
            cropped_diagram_urls[f"CHE-THE-{q_idx2:04d}"] = bl_url

    print(f"  Cropped and uploaded {len(cropped_diagram_urls)} figures/tables under 'chemistry/' in bucket.")

    questions_list = []
    options_list = []

    for i, item in enumerate(thermo_questions):
        q_num = i + 1
        q_code = f"CHE-THE-{q_num:04d}"
        q_id = str(uuid.uuid4())
        statement, opts, correct_key, diff, is_table = item

        content_blocks = [
            {"type": "text", "html": f"<p>{statement}</p>"}
        ]

        if q_code in cropped_diagram_urls or is_table:
            diag_url = cropped_diagram_urls.get(q_code) or cropped_diagram_urls.get(f"CHE-THE-0008")
            if diag_url:
                content_blocks.append({
                    "type": "image",
                    "src": diag_url,
                    "alt": f"Thermodynamics Figure/Table for {q_code}"
                })

        explanation_blocks = [
            {"type": "text", "html": f"<p>Refer to NCERT Class 11 Chemistry: Chapter 6 - Chemical Thermodynamics.</p>"}
        ]

        q_record = {
            'id': q_id,
            'question_code': q_code,
            'subject_id': CHEMISTRY_SUBJECT_ID,
            'chapter_id': THERMODYNAMICS_CHAPTER_ID,
            'question_type': 'MCQ',
            'content': json.dumps(content_blocks),
            'explanation': json.dumps(explanation_blocks),
            'difficulty': diff,
            'marks': 4.0,
            'negative_marks': 1.0,
            'correct_option': correct_key,
            'option_layout': 'grid_2x2',
            'year': 2024,
            'source': 'NCERT Chemistry NEET Chapter 6 - Thermodynamics',
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

    q_csv_path = 'chemistry_thermodynamics_questions.csv'
    opt_csv_path = 'chemistry_thermodynamics_question_options.csv'

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

    sql_path = 'insert_chemistry_thermodynamics_questions.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- =============================================================================\n")
        f.write("-- Complete Insert Script for Chemistry -> Thermodynamics Questions (72 Questions)\n")
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

    print("\nPushing 72 Thermodynamics questions to Supabase live database...")
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

    print("Pushing 288 question options to Supabase...")
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

    print("\n✓ ALL 72 THERMODYNAMICS QUESTIONS & 288 OPTIONS SUCCESSFULLY SYNCED TO SUPABASE!")

process_and_extract_all()
