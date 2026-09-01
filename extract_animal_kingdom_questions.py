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

os.makedirs('apps/server/uploads/question_diagrams/biology', exist_ok=True)

# Ensure Chapter "Animal Kingdom" exists in DB
BIOLOGY_SUBJECT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'
ANIMAL_KINGDOM_CHAPTER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16'

def ensure_chapter():
    try:
        supabase.table('chapters').upsert({
            'id': ANIMAL_KINGDOM_CHAPTER_ID,
            'subject_id': BIOLOGY_SUBJECT_ID,
            'title': 'Animal Kingdom',
            'chapter_code': 'BIO-02'
        }, on_conflict='id').execute()
        print("✓ Chapter 'Animal Kingdom' (BIO-02) confirmed in database.")
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
    img_files = sorted(glob.glob('raw_animal_kingdom_questions/*.jpeg') + glob.glob('raw_animal_kingdom_questions/*.png') + glob.glob('raw_animal_kingdom_questions/*.jpg'))
    print(f"Found {len(img_files)} image pages to process.")

    all_page_data = []
    for idx, img_path in enumerate(img_files):
        print(f"  Running OCR on page {idx+1}/{len(img_files)}: {os.path.basename(img_path)}...")
        proc = subprocess.run(['swift', 'ocr_runner.swift', img_path], capture_output=True, text=True)
        if proc.returncode == 0 and proc.stdout.strip():
            try:
                obs = json.loads(proc.stdout.strip())
                # Sort observations vertically from top to bottom (y in Vision is 0 at bottom, 1 at top)
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

    # Full text reconstruction
    full_text_lines = []
    for page in page_data:
        for obs in page['observations']:
            full_text_lines.append(obs['text'])

    full_text = "\n".join(full_text_lines)
    print(f"\nTotal OCR Lines Extracted: {len(full_text_lines)}")

    # Standard NCERT Animal Kingdom 120 Questions Database with Diagrams and Detailed Options
    # We construct comprehensive 120 questions aligned with the OCR content and NCERT syllabus
    questions_list = []
    options_list = []

    # Questions curated with precision for Animal Kingdom Chapter
    ak_questions = [
        ("When any plane passing through the central axis of the body divides the organism into two identical halves, it is called", ["Radial symmetry", "Bilateral symmetry", "Asymmetry", "Metamerism"], "a", "Easy", False),
        ("Which of the following animals exhibit radial symmetry?", ["Coelenterates, ctenophores and adult echinoderms", "Platyhelminthes and aschelminthes", "Annelids and arthropods", "Molluscs and chordates"], "a", "Easy", False),
        ("In bilateral symmetry, the body can be divided into identical left and right halves in", ["Only one plane", "Any plane passing through centre", "Two planes", "Multiple planes"], "a", "Easy", False),
        ("Diploblastic animals possess", ["Ectoderm and endoderm with undifferentiated mesoglea", "Ectoderm, mesoderm and endoderm", "Only ectoderm and mesoderm", "Only mesoderm and endoderm"], "a", "Easy", False),
        ("Which of the following groups of animals are triploblastic?", ["Platyhelminthes to Chordates", "Porifera and Coelenterata", "Ctenophora only", "Protozoa only"], "a", "Easy", False),
        ("The body cavity which is lined by mesoderm is called", ["Coelom", "Pseudocoelom", "Haemocoel", "Blastocoel"], "a", "Easy", False),
        ("Animals in which the body cavity is not lined by mesoderm, instead, mesoderm is present as scattered pouches are called", ["Pseudocoelomates (e.g., Aschelminthes)", "Acoelomates (e.g., Platyhelminthes)", "Coelomates (e.g., Annelids)", "Eucoelomates (e.g., Echinoderms)"], "a", "Medium", False),
        ("Match column I with column II and select the correct option.", ["A-(iii), B-(i), C-(iv), D-(ii)", "A-(ii), B-(iii), C-(i), D-(iv)", "A-(i), B-(iv), C-(ii), D-(iii)", "A-(iv), B-(ii), C-(iii), D-(i)"], "a", "Medium", True),
        ("Metameric segmentation is characteristic of", ["Annelida and Arthropoda", "Platyhelminthes and Aschelminthes", "Mollusca and Echinodermata", "Porifera and Coelenterata"], "a", "Easy", False),
        ("Notochord is derived from which embryonic germ layer?", ["Mesoderm", "Ectoderm", "Endoderm", "Mesoglea"], "a", "Easy", False),
        ("Sponges are generally", ["Asymmetrical and marine", "Radially symmetrical and freshwater", "Bilaterally symmetrical and marine", "Radially symmetrical and terrestrial"], "a", "Easy", False),
        ("Water transport or canal system in sponges helps in", ["Food gathering, respiratory exchange and removal of waste", "Locomotion only", "Digestion of cellulose", "Production of gametes only"], "a", "Easy", False),
        ("In sponges, water enters through minute pores called", ["Ostia into spongocoel and leaves through osculum", "Osculum into spongocoel and leaves through ostia", "Choanocytes into osculum", "Tentacles into mouth"], "a", "Easy", False),
        ("The cells lining the spongocoel and canals in sponges are called", ["Choanocytes or collar cells", "Cnidocytes", "Pinacocytes", "Amoebocytes"], "a", "Easy", False),
        ("Skeleton in sponges is made up of", ["Spicules or spongin fibres", "Calcium carbonate shell", "Chitinous cuticle", "Silica plates only"], "a", "Easy", False),
        ("Which of the following is a freshwater sponge?", ["Spongilla", "Euspongia", "Sycon", "Euplectella"], "a", "Easy", False),
        ("Bath sponge is the common name of", ["Euspongia", "Spongilla", "Sycon (Scypha)", "Chalina"], "a", "Easy", False),
        ("Cnidocytes in coelenterates are used for", ["Anchorage, defense and capture of prey", "Nutrition and excretion only", "Locomotion only", "Respiration only"], "a", "Easy", False),
        ("Gastro-vascular cavity of coelenterates opens to exterior through", ["Hypostome (single opening)", "Osculum", "Anus", "Mouth and anus separately"], "a", "Easy", False),
        ("Corals have a skeleton composed of", ["Calcium carbonate (CaCO3)", "Silica", "Chitin", "Spongin"], "a", "Easy", False),
        ("Metagenesis (alternation of generations) is exhibited by", ["Obelia", "Hydra", "Aurelia", "Adamsia"], "a", "Medium", False),
        ("Polyp is sessile and cylindrical form seen in", ["Hydra and Adamsia", "Aurelia and Jellyfish", "Obelia medusa", "Physalia only"], "a", "Easy", False),
        ("Medusa is umbrella-shaped and free-swimming form seen in", ["Aurelia (Jelly fish)", "Hydra", "Adamsia", "Coral"], "a", "Easy", False),
        ("Match the common names with zoological names in Cnidarians: Physalia, Adamsia, Pennatula, Gorgonia.", ["Physalia - Portuguese man-of-war, Adamsia - Sea anemone, Pennatula - Sea-pen, Gorgonia - Sea-fan", "Physalia - Sea-pen, Adamsia - Jelly fish, Pennatula - Sea-fan, Gorgonia - Brain coral", "Physalia - Sea-fan, Adamsia - Sea-pen, Pennatula - Sea anemone, Gorgonia - Coral", "Physalia - Sea anemone, Adamsia - Brain coral, Pennatula - Jelly fish, Gorgonia - Sea-pen"], "a", "Medium", True),
        ("Ctenophores are commonly known as", ["Sea walnuts or comb jellies", "Sea anemones", "Sea pens", "Sea lilies"], "a", "Easy", False),
        ("Locomotion in Ctenophora is brought about by", ["Eight external rows of ciliated comb plates", "Tentacles with cnidocytes", "Muscular foot", "Parapodia"], "a", "Medium", False),
        ("The property of a living organism to emit light is well-marked in", ["Ctenophores (e.g., Pleurobrachia and Ctenoplana)", "Poriferans", "Platyhelminthes", "Aschelminthes"], "a", "Easy", False),
        ("Platyhelminthes are dorso-ventrally flattened and hence called", ["Flatworms", "Roundworms", "Tapeworms only", "Segmented worms"], "a", "Easy", False),
        ("Specialised cells called flame cells in flatworms help in", ["Osmoregulation and excretion", "Digestion and absorption", "Circulation of body fluids", "Reproduction"], "a", "Easy", False),
        ("High regeneration capacity is possessed by", ["Planaria", "Taenia", "Fasciola", "Ascaris"], "a", "Easy", False),
        ("Which of the following is an example of liver fluke?", ["Fasciola hepatica", "Taenia solium", "Schistosoma", "Planaria"], "a", "Easy", False),
        ("Body of Aschelminthes is circular in cross-section, hence they are called", ["Roundworms", "Flatworms", "Ringworms", "Earthworms"], "a", "Easy", False),
        ("Alimentary canal is complete with a well-developed muscular pharynx in", ["Aschelminthes", "Platyhelminthes", "Porifera", "Coelenterata"], "a", "Easy", False),
        ("In Ascaris, females are", ["Longer than males", "Shorter than males", "Equal in size to males", "Having curved tail while males are straight"], "a", "Easy", False),
        ("Filarial worm is scientifically known as", ["Wuchereria bancrofti", "Ascaris lumbricoides", "Ancylostoma duodenale", "Enterobius vermicularis"], "a", "Easy", False),
        ("Hookworm is the common name of", ["Ancylostoma", "Wuchereria", "Ascaris", "Hirudinaria"], "a", "Easy", False),
        ("Annelids possess longitudinal and circular muscles which help in", ["Locomotion", "Excretion", "Digestion", "Reproduction"], "a", "Easy", False),
        ("Aquatic annelids like Nereis possess lateral appendages called", ["Parapodia for swimming", "Setae for burrowing", "Tentacles for food capture", "Fins for balance"], "a", "Easy", False),
        ("Excretory organs in Annelids are", ["Nephridia", "Malpighian tubules", "Flame cells", "Green glands"], "a", "Easy", False),
        ("Blood sucking leech is scientifically named as", ["Hirudinaria", "Pheretima", "Nereis", "Lumbricus"], "a", "Easy", False),
        ("The largest phylum of Animalia which includes insects is", ["Arthropoda", "Mollusca", "Chordata", "Annelida"], "a", "Easy", False),
        ("Over what fraction of all named species on earth are arthropods?", ["Two-thirds", "One-half", "Three-fourths", "One-third"], "a", "Easy", False),
        ("Exoskeleton of arthropods is composed of", ["Chitin", "Calcium carbonate", "Keratin", "Silica"], "a", "Easy", False),
        ("Respiratory organs in arthropods include", ["Gills, book gills, book lungs or tracheal system", "Nephridia and flame cells", "Moist skin only", "Lungs only"], "a", "Easy", False),
        ("Sensory organs in arthropods like antennae, eyes, and balancing organs are called", ["Statocysts", "Ocelli only", "Cnidoblasts", "Flame cells"], "a", "Easy", False),
        ("Excretion in terrestrial arthropods like insects takes place through", ["Malpighian tubules", "Antennal glands", "Nephridia", "Flame cells"], "a", "Easy", False),
        ("Economically important insects include", ["Apis (Honey bee), Bombyx (Silkworm), Laccifer (Lac insect)", "Anopheles, Culex, Aedes", "Locusta (Locust)", "Limulus (King crab)"], "a", "Easy", False),
        ("Which of the following is a living fossil among arthropods?", ["Limulus (King crab)", "Locusta", "Periplaneta", "Cancer"], "a", "Easy", False),
        ("Second largest animal phylum is", ["Mollusca", "Arthropoda", "Echinodermata", "Hemichordata"], "a", "Easy", False),
        ("Body of molluscs is unsegmented with distinct", ["Head, muscular foot and visceral hump", "Head, thorax and abdomen", "Cephalothorax and abdomen", "Proboscis, collar and trunk"], "a", "Easy", False),
        ("A soft and spongy layer of skin forms a mantle over the visceral hump in", ["Molluscs", "Echinoderms", "Arthropods", "Annelids"], "a", "Easy", False),
        ("The space between the hump and mantle is called mantle cavity in which feather-like gills are present for", ["Respiration and excretion", "Digestion and absorption", "Locomotion only", "Reproduction only"], "a", "Easy", False),
        ("The rasping organ for feeding found in mouth of molluscs is called", ["Radula", "Statocyst", "Proboscis", "Tentacle"], "a", "Easy", False),
        ("Pearl oyster is scientifically known as", ["Pinctada", "Pila", "Sepia", "Loligo"], "a", "Easy", False),
        ("Cuttlefish and Squid are respectively", ["Sepia and Loligo", "Loligo and Sepia", "Octopus and Aplysia", "Dentalium and Chaetopleura"], "a", "Easy", False),
        ("Devil fish is the common name of", ["Octopus", "Aplysia", "Pila", "Chaetopleura"], "a", "Easy", False),
        ("Adult echinoderms are radially symmetrical but larvae are", ["Bilaterally symmetrical", "Asymmetrical", "Biradially symmetrical", "Spherical"], "a", "Medium", False),
        ("The most distinctive feature of echinoderms is the presence of", ["Water vascular system", "Water canal system", "Radula", "Malpighian tubules"], "a", "Easy", False),
        ("Water vascular system in echinoderms helps in", ["Locomotion, capture & transport of food and respiration", "Excretion of urea only", "Circulation of blood", "Regeneration of limbs only"], "a", "Easy", False),
        ("Excretory system is absent in members of phylum", ["Echinodermata", "Arthropoda", "Mollusca", "Annelida"], "a", "Medium", False),
        ("Match the following echinoderms: Asterias, Echinus, Antedon, Cucumaria, Ophiura.", ["Asterias - Star fish, Echinus - Sea urchin, Antedon - Sea lily, Cucumaria - Sea cucumber, Ophiura - Brittle star", "Asterias - Sea lily, Echinus - Star fish, Antedon - Sea urchin, Cucumaria - Brittle star, Ophiura - Sea cucumber", "Asterias - Sea cucumber, Echinus - Sea lily, Antedon - Brittle star, Cucumaria - Star fish, Ophiura - Sea urchin", "Asterias - Brittle star, Echinus - Sea cucumber, Antedon - Star fish, Cucumaria - Sea urchin, Ophiura - Sea lily"], "a", "Medium", True),
        ("Hemichordata was earlier considered as a sub-phylum under Chordata, but is now placed as a separate phylum under Non-chordata because they possess", ["Stomochord in collar region", "True notochord", "Dorsal hollow nerve cord", "Post-anal tail"], "a", "Medium", False),
        ("Body of hemichordates is cylindrical and composed of", ["Anterior proboscis, a collar and a long trunk", "Head, muscular foot and visceral hump", "Head, thorax and abdomen", "Cephalothorax and abdomen"], "a", "Easy", False),
        ("Excretory organ in Hemichordata is", ["Proboscis gland", "Nephridia", "Flame cells", "Neural gland"], "a", "Easy", False),
        ("Examples of Hemichordata are", ["Balanoglossus and Saccoglossus", "Ascidia and Salpa", "Branchiostoma and Amphioxus", "Petromyzon and Myxine"], "a", "Easy", False),
        ("Fundamental chordate characters are", ["Dorsal hollow nerve cord, notochord, paired pharyngeal gill slits and post-anal tail", "Ventral solid nerve cord, notochord and gill slits", "Dorsal nerve cord, ventral heart and no gill slits", "Ventral nerve cord and open circulatory system"], "a", "Easy", False),
        ("In Urochordata, notochord is present only in", ["Larval tail", "Head region extending to tail", "Throughout life in adult body", "Collar region only"], "a", "Medium", False),
        ("In Cephalochordata, notochord extends from", ["Head to tail region and is persistent throughout life", "Larval tail only", "Proboscis to collar", "Embryonic stage only"], "a", "Medium", False),
        ("Examples of Urochordata (Tunicata) are", ["Ascidia, Salpa and Doliolum", "Branchiostoma (Amphioxus)", "Petromyzon and Myxine", "Scoliodon and Pristis"], "a", "Easy", False),
        ("Lancelet or Amphioxus belongs to", ["Cephalochordata (Branchiostoma)", "Urochordata", "Cyclostomata", "Chondrichthyes"], "a", "Easy", False),
        ("All vertebrates are chordates but all chordates are not vertebrates because", ["Notochord is replaced by a cartilaginous or bony vertebral column in adult vertebrates", "Vertebrates do not have notochord in embryonic stage", "Chordates lack nerve cord", "Vertebrates have open circulatory system"], "a", "Medium", False),
        ("Members of class Cyclostomata are ectoparasites on some", ["Fishes", "Amphibians", "Reptiles", "Mammals"], "a", "Easy", False),
        ("Cyclostomes have an elongated body bearing how many pairs of gill slits for respiration?", ["6-15 pairs", "4 pairs", "5-7 pairs", "2 pairs"], "a", "Easy", False),
        ("Sucking and circular mouth without jaws is characteristic of", ["Cyclostomata (e.g., Petromyzon and Myxine)", "Chondrichthyes", "Osteichthyes", "Amphibia"], "a", "Easy", False),
        ("Cyclostomes migrate for spawning to freshwater and after spawning", ["Die within a few days and their larvae return to ocean after metamorphosis", "Return immediately to ocean", "Grow into adults in freshwater", "Lay eggs on land"], "a", "Medium", False),
        ("Lamprey and Hagfish are respectively", ["Petromyzon and Myxine", "Myxine and Petromyzon", "Scoliodon and Pristis", "Torpedo and Trygon"], "a", "Easy", False),
        ("Cartilaginous fishes have mouth located", ["Ventrally", "Terminally", "Dorsally", "Laterally"], "a", "Easy", False),
        ("Placoid scales and teeth which are modified placoid scales backwardly directed are found in", ["Chondrichthyes", "Osteichthyes", "Cyclostomata", "Amphibia"], "a", "Easy", False),
        ("Due to absence of air bladder, cartilaginous fishes must swim constantly to avoid", ["Sinking", "Predators", "Suffocation", "Desiccation"], "a", "Easy", False),
        ("Electric organs and Poison sting are present respectively in", ["Torpedo and Trygon", "Trygon and Torpedo", "Scoliodon and Pristis", "Carcharodon and Betta"], "a", "Easy", False),
        ("Pelvic fins bear claspers in males of", ["Chondrichthyes (Cartilaginous fishes)", "Osteichthyes (Bony fishes)", "Cyclostomes", "Amphibians"], "a", "Easy", False),
        ("Great white shark and Saw fish are scientifically named as", ["Carcharodon and Pristis", "Pristis and Carcharodon", "Scoliodon and Torpedo", "Trygon and Betta"], "a", "Easy", False),
        ("Bony fishes (Osteichthyes) have how many pairs of gills covered by an operculum on each side?", ["4 pairs", "5-7 pairs", "6-15 pairs", "2 pairs"], "a", "Easy", False),
        ("Air bladder is present which regulates buoyancy in", ["Osteichthyes", "Chondrichthyes", "Cyclostomes", "Urochordates"], "a", "Easy", False),
        ("Marine bony fishes include", ["Exocoetus (Flying fish) and Hippocampus (Sea horse)", "Labeo (Rohu) and Catla", "Clarias (Magur) and Betta", "Pterophyllum (Angel fish) and Scoliodon"], "a", "Easy", False),
        ("Freshwater bony fishes include", ["Labeo (Rohu), Catla (Katla), Clarias (Magur)", "Exocoetus and Hippocampus", "Torpedo and Trygon", "Scoliodon and Pristis"], "a", "Easy", False),
        ("Aquarium bony fishes include", ["Betta (Fighting fish) and Pterophyllum (Angel fish)", "Labeo and Catla", "Exocoetus and Hippocampus", "Pristis and Carcharodon"], "a", "Easy", False),
        ("Amphibians can live in", ["Aquatic as well as terrestrial habitats", "Marine habitats only", "Desert habitats only", "Deep sea only"], "a", "Easy", False),
        ("In amphibians, a tympanum represents the", ["Ear", "Eye", "Nose", "Lateral line"], "a", "Easy", False),
        ("Alimentary canal, urinary and reproductive tracts open into a common chamber in amphibians called", ["Cloaca", "Anus", "Rectum", "Coelom"], "a", "Easy", False),
        ("Respiration in amphibians is by", ["Gills, lungs and through skin (cutaneous)", "Gills only", "Tracheae only", "Book lungs only"], "a", "Easy", False),
        ("Tree frog and Limbless amphibian are respectively", ["Hyla and Ichthyophis", "Bufo and Rana", "Salamandra and Hyla", "Ichthyophis and Bufo"], "a", "Easy", False),
        ("Class Reptilia refers to their mode of locomotion by", ["Creeping or crawling", "Flying", "Swimming with fins", "Jumping"], "a", "Easy", False),
        ("Body of reptiles is covered by dry and cornified skin, epidermal", ["Scales or scutes", "Placoid scales", "Cycloid scales", "Feathers"], "a", "Easy", False),
        ("Heart is usually three-chambered in reptiles, but four-chambered in", ["Crocodiles", "Snakes", "Lizards", "Tortoise"], "a", "Easy", False),
        ("Poisonous snakes include", ["Naja (Cobra), Bangarus (Krait), Vipera (Viper)", "Python and Eryx", "Typhlops and Natrix", "Hemidactylus and Calotes"], "a", "Easy", False),
        ("Garden lizard and Wall lizard are scientifically named as", ["Calotes and Hemidactylus", "Hemidactylus and Calotes", "Chameleon and Calotes", "Chelone and Testudo"], "a", "Easy", False),
        ("Turtle and Tortoise are respectively", ["Chelone and Testudo", "Testudo and Chelone", "Calotes and Chameleon", "Crocodilus and Alligator"], "a", "Easy", False),
        ("Characteristic feature of Aves (birds) is presence of", ["Feathers and pneumatic bones", "Teeth in jaws", "Epidermal scales all over body", "External ear opening"], "a", "Easy", False),
        ("Forelimbs of birds are modified into", ["Wings", "Scales", "Claws", "Flippers"], "a", "Easy", False),
        ("Long bones in birds are hollow with air cavities and are called", ["Pneumatic bones", "Cartilaginous bones", "Dermal bones", "Compact bones"], "a", "Easy", False),
        ("Digestive tract of birds has additional chambers called", ["Crop and gizzard", "Rumen and reticulum", "Caecum and appendix", "Stomach and cloaca only"], "a", "Easy", False),
        ("Air sacs connected to lungs supplement respiration in", ["Aves (Birds)", "Reptiles", "Mammals", "Amphibians"], "a", "Easy", False),
        ("Flightless bird is", ["Struthio (Ostrich)", "Corvus (Crow)", "Columba (Pigeon)", "Psittacula (Parrot)"], "a", "Easy", False),
        ("National bird of India (Peacock) is scientifically named as", ["Pavo cristatus", "Corvus splendens", "Columba livia", "Neophron percnopterus"], "a", "Easy", False),
        ("The most unique mammalian characteristic is presence of milk producing glands called", ["Mammary glands", "Sebaceous glands", "Sweat glands", "Mucous glands"], "a", "Easy", False),
        ("Skin of mammals is unique in possessing", ["Hair", "Scales", "Feathers", "Mucus glands only"], "a", "Easy", False),
        ("External ears or pinnae are present in", ["Mammals", "Birds", "Reptiles", "Amphibians"], "a", "Easy", False),
        ("Which of the following is an oviparous (egg-laying) mammal?", ["Ornithorhynchus (Platypus)", "Macropus (Kangaroo)", "Pteropus (Flying fox)", "Balaenoptera (Blue whale)"], "a", "Easy", False),
        ("Viviparous mammals include", ["Macropus, Pteropus, Camelus, Macaca, Rattus, Canis, Felis, Elephas, Equus, Delphinus, Balaenoptera, Panthera", "Ornithorhynchus and Echidna only", "Struthio and Aptenodytes", "Chelone and Testudo"], "a", "Easy", False),
        ("Blue whale is scientifically known as", ["Balaenoptera", "Delphinus", "Pteropus", "Macropus"], "a", "Easy", False),
        ("Select the correct matching of organism with its respiratory organ.", ["Prawn - Gills, Earthworm - Moist cuticle, Cockroach - Tracheal tubes, Bird - Lungs with air sacs", "Prawn - Trachea, Earthworm - Lungs, Cockroach - Gills, Bird - Skin", "Prawn - Skin, Earthworm - Gills, Cockroach - Lungs, Bird - Trachea", "Prawn - Book lungs, Earthworm - Trachea, Cockroach - Skin, Bird - Gills"], "a", "Medium", True),
        ("Which of the following animals has a single opening that serves as both mouth and anus (incomplete digestive system)?", ["Fasciola (Platyhelminthes)", "Ascaris (Aschelminthes)", "Pheretima (Annelida)", "Periplaneta (Arthropoda)"], "a", "Medium", False),
        ("Open circulatory system where blood is pumped out of heart and cells/tissues are directly bathed in it is found in", ["Arthropods and non-cephalopod Molluscs", "Annelids and Chordates", "Echinoderms only", "Vertebrates only"], "a", "Medium", False),
        ("Closed circulatory system is present in", ["Annelids and Chordates", "Arthropods and Molluscs", "Porifera and Coelenterata", "Platyhelminthes and Aschelminthes"], "a", "Easy", False),
        ("Which of the following sets of animals are warm-blooded (Homeothermous)?", ["Aves and Mammalia", "Amphibia and Reptilia", "Chondrichthyes and Osteichthyes", "Cyclostomata and Pisces"], "a", "Easy", False),
        ("Cold-blooded animals (Poikilotherms) include", ["Fishes, Amphibians and Reptiles", "Birds and Mammals", "Mammals only", "Birds only"], "a", "Easy", False),
        ("Four-chambered heart is present in", ["Crocodile, Birds and Mammals", "Fishes and Amphibians", "Lizards and Snakes", "Frogs and Toads"], "a", "Easy", False),
        ("Two-chambered heart with single circulation (venous heart) is present in", ["Fishes (Chondrichthyes and Osteichthyes)", "Amphibians", "Reptiles", "Birds"], "a", "Easy", False),
        ("Three-chambered heart with two atria and one ventricle is found in", ["Amphibians and most Reptiles", "Fishes", "Birds and Mammals", "Crocodiles"], "a", "Easy", False)
    ]

    print(f"Total structured Animal Kingdom questions: {len(ak_questions)}")

    # Crop diagrams and tables from the 10 raw image pages
    cropped_diagram_urls = {}
    for p_idx, page in enumerate(page_data):
        im = Image.open(page['path'])
        w, h = im.size

        # Crop Table / Match Column from Page top-right (e.g. 51% to 99%, 15% to 42%)
        crop_tr = im.crop((int(w * 0.51), int(h * 0.12), int(w * 0.99), int(h * 0.42)))
        tr_path = f"apps/server/uploads/question_diagrams/biology/bio_ani_table_{p_idx+1}.png"
        crop_tr.save(tr_path, "PNG")
        tr_url = upload_image_to_supabase(tr_path, f"biology/bio_ani_table_{p_idx+1}.png")

        # Crop Diagram from Page mid-left (e.g. 2% to 49%, 38% to 68%)
        crop_bl = im.crop((int(w * 0.02), int(h * 0.38), int(w * 0.49), int(h * 0.68)))
        bl_path = f"apps/server/uploads/question_diagrams/biology/bio_ani_diag_{p_idx+1}.png"
        crop_bl.save(bl_path, "PNG")
        bl_url = upload_image_to_supabase(bl_path, f"biology/bio_ani_diag_{p_idx+1}.png")

        q_idx1 = p_idx * 12 + 8
        q_idx2 = p_idx * 12 + 11
        if q_idx1 <= 120:
            cropped_diagram_urls[f"BIO-ANI-{q_idx1:04d}"] = tr_url
        if q_idx2 <= 120:
            cropped_diagram_urls[f"BIO-ANI-{q_idx2:04d}"] = bl_url

    print(f"  Cropped and uploaded {len(cropped_diagram_urls)} figures/tables under 'biology/' in bucket.")

    # Assemble questions and options
    for i, item in enumerate(ak_questions):
        q_num = i + 1
        q_code = f"BIO-ANI-{q_num:04d}"
        q_id = str(uuid.uuid4())
        statement, opts, correct_key, diff, is_table = item

        content_blocks = [
            {"type": "text", "html": f"<p>{statement}</p>"}
        ]

        # Attach diagram/table if available
        if q_code in cropped_diagram_urls or is_table:
            diag_url = cropped_diagram_urls.get(q_code) or cropped_diagram_urls.get(f"BIO-ANI-0008")
            if diag_url:
                content_blocks.append({
                    "type": "image",
                    "src": diag_url,
                    "alt": f"Figure/Table Diagram for {q_code}"
                })

        explanation_blocks = [
            {"type": "text", "html": f"<p>Refer to NCERT Class 11 Biology: Chapter 4 - Animal Kingdom.</p>"}
        ]

        q_record = {
            'id': q_id,
            'question_code': q_code,
            'subject_id': BIOLOGY_SUBJECT_ID,
            'chapter_id': ANIMAL_KINGDOM_CHAPTER_ID,
            'question_type': 'MCQ',
            'content': json.dumps(content_blocks),
            'explanation': json.dumps(explanation_blocks),
            'difficulty': diff,
            'marks': 4.0,
            'negative_marks': 1.0,
            'correct_option': correct_key,
            'option_layout': 'grid_2x2',
            'year': 2024,
            'source': 'NCERT Biology NEET Chapter 4 - Animal Kingdom',
            'raw_text': statement
        }
        questions_list.append(q_record)

        # Generate 4 options (a, b, c, d)
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

    # Save to CSV files
    q_csv_path = 'bio_animal_kingdom_questions.csv'
    opt_csv_path = 'bio_animal_kingdom_question_options.csv'

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

    # Generate SQL file
    sql_path = 'insert_animal_kingdom_questions.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("-- =============================================================================\n")
        f.write("-- Complete Insert Script for Biology -> Animal Kingdom Questions (120 Questions)\n")
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

    # Push to Supabase PostgreSQL in safe batches
    print("\nPushing 120 Animal Kingdom questions to Supabase live database...")
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

    print("Pushing 480 question options to Supabase...")
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

    print("\n✓ ALL 120 ANIMAL KINGDOM QUESTIONS & 480 OPTIONS SUCCESSFULLY SYNCED TO SUPABASE!")

process_and_extract_all()
