import { PaperMargins } from './document.js';
import { OptionLayoutType } from './question.js';

export interface AppSettings {
  defaultFont: string;
  defaultFontSize: number;
  defaultPaperSize: 'A4';
  defaultMargins: PaperMargins;
  defaultQuestionStyle: 'number' | 'number_dot' | 'Q_number';
  defaultOptionStyle: OptionLayoutType;
  defaultEquationSize: number;
  autosaveIntervalMs: number; // e.g. 2000
  theme: 'dark' | 'white' | 'dark-blue' | 'light' | 'system';
  exportSettings: {
    pdfDpi: number;
    embedFonts: boolean;
    watermarkText?: string;
    showPageNumbers: boolean;
  };
  backupSettings: {
    autoBackupDaily: boolean;
    maxBackupsToKeep: number;
  };
}
