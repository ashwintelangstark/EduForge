export interface FontDefinition {
  name: string;
  family: string;
  category: 'Standard' | 'Sans-Serif' | 'Serif' | 'STEM & Math' | 'Monospace' | 'Handwriting & Display';
  googleFont?: string; // query name for Google Fonts API
  isDefault?: boolean;
}

export const FONTS_CATALOG: FontDefinition[] = [
  // ================= 1. Standard & Office Classics (20 fonts) =================
  { name: 'Calibri (Body)', family: "Calibri, 'Segoe UI', Candara, sans-serif", category: 'Standard', isDefault: true },
  { name: 'Calibri Light (Headings)', family: "'Calibri Light', 'Segoe UI Light', sans-serif", category: 'Standard' },
  { name: 'Aptos (Default)', family: "Aptos, 'Segoe UI', -apple-system, sans-serif", category: 'Standard' },
  { name: 'Aptos Display', family: "'Aptos Display', 'Segoe UI', sans-serif", category: 'Standard' },
  { name: 'Arial', family: "Arial, Helvetica, sans-serif", category: 'Standard' },
  { name: 'Arial Black', family: "'Arial Black', Gadget, sans-serif", category: 'Standard' },
  { name: 'Times New Roman', family: "'Times New Roman', Times, serif", category: 'Standard' },
  { name: 'Georgia', family: "Georgia, 'Times New Roman', serif", category: 'Standard' },
  { name: 'Garamond', family: "Garamond, 'EB Garamond', serif", category: 'Standard' },
  { name: 'Cambria', family: "Cambria, 'Georgia', serif", category: 'Standard' },
  { name: 'Cambria Math', family: "'Cambria Math', Cambria, serif", category: 'Standard' },
  { name: 'Constantia', family: "Constantia, 'Palatino Linotype', serif", category: 'Standard' },
  { name: 'Corbel', family: "Corbel, 'Segoe UI', sans-serif", category: 'Standard' },
  { name: 'Candara', family: "Candara, 'Segoe UI', sans-serif", category: 'Standard' },
  { name: 'Century Gothic', family: "'Century Gothic', Futura, sans-serif", category: 'Standard' },
  { name: 'Trebuchet MS', family: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif", category: 'Standard' },
  { name: 'Verdana', family: "Verdana, Geneva, sans-serif", category: 'Standard' },
  { name: 'Tahoma', family: "Tahoma, Verdana, sans-serif", category: 'Standard' },
  { name: 'Palatino Linotype', family: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", category: 'Standard' },
  { name: 'Book Antiqua', family: "'Book Antiqua', Palatino, serif", category: 'Standard' },
  { name: 'Baskerville', family: "Baskerville, 'Libre Baskerville', serif", category: 'Standard' },
  { name: 'Segoe UI', family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", category: 'Standard' },
  { name: 'Impact', family: "Impact, Charcoal, sans-serif", category: 'Standard' },
  { name: 'Comic Sans MS', family: "'Comic Sans MS', 'Comic Sans', cursive", category: 'Standard' },

  // ================= 2. Modern Sans-Serif (20 fonts) =================
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Sans-Serif', googleFont: 'Inter:wght@300;400;500;600;700;800;900' },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'Sans-Serif', googleFont: 'Roboto:wght@300;400;500;700;900' },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'Sans-Serif', googleFont: 'Open+Sans:wght@300;400;600;700;800' },
  { name: 'Lato', family: "'Lato', sans-serif", category: 'Sans-Serif', googleFont: 'Lato:wght@300;400;700;900' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Sans-Serif', googleFont: 'Montserrat:wght@300;400;500;600;700;800' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Sans-Serif', googleFont: 'Poppins:wght@300;400;500;600;700;800' },
  { name: 'Nunito', family: "'Nunito', sans-serif", category: 'Sans-Serif', googleFont: 'Nunito:wght@300;400;600;700;800' },
  { name: 'Raleway', family: "'Raleway', sans-serif", category: 'Sans-Serif', googleFont: 'Raleway:wght@300;400;500;600;700' },
  { name: 'Ubuntu', family: "'Ubuntu', sans-serif", category: 'Sans-Serif', googleFont: 'Ubuntu:wght@300;400;500;700' },
  { name: 'Rubik', family: "'Rubik', sans-serif", category: 'Sans-Serif', googleFont: 'Rubik:wght@300;400;500;600;700' },
  { name: 'Work Sans', family: "'Work Sans', sans-serif", category: 'Sans-Serif', googleFont: 'Work+Sans:wght@300;400;500;600;700' },
  { name: 'Fira Sans', family: "'Fira Sans', sans-serif", category: 'Sans-Serif', googleFont: 'Fira+Sans:wght@300;400;500;600;700' },
  { name: 'Quicksand', family: "'Quicksand', sans-serif", category: 'Sans-Serif', googleFont: 'Quicksand:wght@300;400;500;600;700' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", category: 'Sans-Serif', googleFont: 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", category: 'Sans-Serif', googleFont: 'DM+Sans:wght@400;500;700' },
  { name: 'Outfit', family: "'Outfit', sans-serif", category: 'Sans-Serif', googleFont: 'Outfit:wght@300;400;500;600;700' },
  { name: 'Cabin', family: "'Cabin', sans-serif", category: 'Sans-Serif', googleFont: 'Cabin:wght@400;500;600;700' },
  { name: 'Manrope', family: "'Manrope', sans-serif", category: 'Sans-Serif', googleFont: 'Manrope:wght@300;400;500;600;700;800' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", category: 'Sans-Serif', googleFont: 'Space+Grotesk:wght@400;500;600;700' },
  { name: 'Syne', family: "'Syne', sans-serif", category: 'Sans-Serif', googleFont: 'Syne:wght@400;600;700;800' },

  // ================= 3. Serif & Editorial (18 fonts) =================
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Serif', googleFont: 'Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'Serif', googleFont: 'Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400' },
  { name: 'Lora', family: "'Lora', serif", category: 'Serif', googleFont: 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400' },
  { name: 'PT Serif', family: "'PT Serif', serif", category: 'Serif', googleFont: 'PT+Serif:ital,wght@0,400;0,700;1,400' },
  { name: 'Cinzel', family: "'Cinzel', serif", category: 'Serif', googleFont: 'Cinzel:wght@400;600;700;900' },
  { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", category: 'Serif', googleFont: 'Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { name: 'EB Garamond', family: "'EB Garamond', serif", category: 'Serif', googleFont: 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400' },
  { name: 'Libre Baskerville', family: "'Libre Baskerville', serif", category: 'Serif', googleFont: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400' },
  { name: 'Spectral', family: "'Spectral', serif", category: 'Serif', googleFont: 'Spectral:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { name: 'Bitter', family: "'Bitter', serif", category: 'Serif', googleFont: 'Bitter:ital,wght@0,400;0,600;0,700;1,400' },
  { name: 'Bodoni Moda', family: "'Bodoni Moda', serif", category: 'Serif', googleFont: 'Bodoni+Moda:ital,wght@0,400;0,600;0,800;1,400' },
  { name: 'Castoro', family: "'Castoro', serif", category: 'Serif', googleFont: 'Castoro:ital@0;1' },
  { name: 'Prata', family: "'Prata', serif", category: 'Serif', googleFont: 'Prata' },
  { name: 'DM Serif Display', family: "'DM Serif Display', serif", category: 'Serif', googleFont: 'DM+Serif+Display:ital@0;1' },
  { name: 'Vollkorn', family: "'Vollkorn', serif", category: 'Serif', googleFont: 'Vollkorn:ital,wght@0,400;0,600;0,700;1,400' },
  { name: 'Arvo', family: "'Arvo', serif", category: 'Serif', googleFont: 'Arvo:ital,wght@0,400;0,700;1,400' },
  { name: 'Crimson Text', family: "'Crimson Text', serif", category: 'Serif', googleFont: 'Crimson+Text:ital,wght@0,400;0,600;0,700;1,400' },
  { name: 'Frank Ruhl Libre', family: "'Frank Ruhl Libre', serif", category: 'Serif', googleFont: 'Frank+Ruhl+Libre:wght@300;400;500;700' },

  // ================= 4. Academic, Math & Science (12 fonts) =================
  { name: 'Computer Modern (LaTeX)', family: "'KaTeX_Main', 'Computer Modern', 'Times New Roman', serif", category: 'STEM & Math' },
  { name: 'STIX Two Text (Scientific)', family: "'STIX Two Text', 'Times New Roman', serif", category: 'STEM & Math', googleFont: 'STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400' },
  { name: 'Crimson Pro (Scholarly)', family: "'Crimson Pro', serif", category: 'STEM & Math', googleFont: 'Crimson+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400' },
  { name: 'Latin Modern Roman', family: "'Latin Modern Roman', 'Computer Modern', serif", category: 'STEM & Math' },
  { name: 'DejaVu Serif', family: "'DejaVu Serif', 'Book Antiqua', serif", category: 'STEM & Math' },
  { name: 'TeX Gyre Termes', family: "'TeX Gyre Termes', 'Times New Roman', serif", category: 'STEM & Math' },
  { name: 'TeX Gyre Pagella', family: "'TeX Gyre Pagella', 'Palatino Linotype', serif", category: 'STEM & Math' },
  { name: 'Libertinus Serif', family: "'Libertinus Serif', 'Times New Roman', serif", category: 'STEM & Math' },
  { name: 'Noto Serif (Universal)', family: "'Noto Serif', serif", category: 'STEM & Math', googleFont: 'Noto+Serif:ital,wght@0,400;0,700;1,400' },
  { name: 'Source Serif 4', family: "'Source Serif 4', serif", category: 'STEM & Math', googleFont: 'Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400' },
  { name: 'Noto Sans Math', family: "'Noto Sans Math', 'Segoe UI Symbol', sans-serif", category: 'STEM & Math', googleFont: 'Noto+Sans+Math' },
  { name: 'Forum (Classicist)', family: "'Forum', serif", category: 'STEM & Math', googleFont: 'Forum' },

  // ================= 5. Monospace & Code (10 fonts) =================
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'Monospace', googleFont: 'JetBrains+Mono:wght@400;500;600;700' },
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'Monospace', googleFont: 'Fira+Code:wght@400;500;600;700' },
  { name: 'Source Code Pro', family: "'Source Code Pro', monospace", category: 'Monospace', googleFont: 'Source+Code+Pro:wght@400;500;600;700' },
  { name: 'Roboto Mono', family: "'Roboto Mono', monospace", category: 'Monospace', googleFont: 'Roboto+Mono:wght@400;500;700' },
  { name: 'Inconsolata', family: "'Inconsolata', monospace", category: 'Monospace', googleFont: 'Inconsolata:wght@400;600;700' },
  { name: 'Space Mono', family: "'Space Mono', monospace", category: 'Monospace', googleFont: 'Space+Mono:ital,wght@0,400;0,700;1,400' },
  { name: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace", category: 'Monospace', googleFont: 'IBM+Plex+Mono:ital,wght@0,400;0,600;1,400' },
  { name: 'Ubuntu Mono', family: "'Ubuntu Mono', monospace", category: 'Monospace', googleFont: 'Ubuntu+Mono:ital,wght@0,400;0,700;1,400' },
  { name: 'Courier New', family: "'Courier New', Courier, monospace", category: 'Monospace' },
  { name: 'Consolas', family: "Consolas, 'Lucida Console', monospace", category: 'Monospace' },

  // ================= 6. Display, Handwriting & Script (14 fonts) =================
  { name: 'Dancing Script', family: "'Dancing Script', cursive", category: 'Handwriting & Display', googleFont: 'Dancing+Script:wght@400;600;700' },
  { name: 'Pacifico', family: "'Pacifico', cursive", category: 'Handwriting & Display', googleFont: 'Pacifico' },
  { name: 'Caveat', family: "'Caveat', cursive", category: 'Handwriting & Display', googleFont: 'Caveat:wght@400;600;700' },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive", category: 'Handwriting & Display', googleFont: 'Shadows+Into+Light' },
  { name: 'Great Vibes', family: "'Great Vibes', cursive", category: 'Handwriting & Display', googleFont: 'Great+Vibes' },
  { name: 'Lobster', family: "'Lobster', cursive", category: 'Handwriting & Display', googleFont: 'Lobster' },
  { name: 'Satisfy', family: "'Satisfy', cursive", category: 'Handwriting & Display', googleFont: 'Satisfy' },
  { name: 'Kalam (Notepad)', family: "'Kalam', cursive", category: 'Handwriting & Display', googleFont: 'Kalam:wght@300;400;700' },
  { name: 'Sacramento', family: "'Sacramento', cursive", category: 'Handwriting & Display', googleFont: 'Sacramento' },
  { name: 'Permanent Marker', family: "'Permanent Marker', cursive", category: 'Handwriting & Display', googleFont: 'Permanent+Marker' },
  { name: 'Marck Script', family: "'Marck Script', cursive", category: 'Handwriting & Display', googleFont: 'Marck+Script' },
  { name: 'Alex Brush', family: "'Alex Brush', cursive", category: 'Handwriting & Display', googleFont: 'Alex+Brush' },
  { name: 'Abril Fatface', family: "'Abril Fatface', cursive", category: 'Handwriting & Display', googleFont: 'Abril+Fatface' },
  { name: 'Cinzel Decorative', family: "'Cinzel Decorative', cursive", category: 'Handwriting & Display', googleFont: 'Cinzel+Decorative:wght@700;900' }
];

const loadedGoogleFonts = new Set<string>();

/**
 * Dynamically loads Google Font stylesheet for a font if not already loaded
 */
export function ensureFontLoaded(font: FontDefinition | string) {
  const fontDef = typeof font === 'string' 
    ? FONTS_CATALOG.find(f => f.name === font || f.family.includes(font))
    : font;

  if (!fontDef || !fontDef.googleFont) return;
  if (loadedGoogleFonts.has(fontDef.googleFont)) return;

  loadedGoogleFonts.add(fontDef.googleFont);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontDef.googleFont}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Preloads popular top fonts for instant rendering in editor & dropdowns
 */
export function preloadCoreFonts() {
  const coreGoogleFonts = FONTS_CATALOG
    .filter(f => f.googleFont)
    .slice(0, 30)
    .map(f => f.googleFont!)
    .join('&family=');

  if (coreGoogleFonts) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${coreGoogleFonts}&display=swap`;
    document.head.appendChild(link);
  }
}
