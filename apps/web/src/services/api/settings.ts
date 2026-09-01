import { AppSettings } from '@eduforge/shared';
import { fetchApi } from './client.js';

export const settingsApi = {
  async getSettings(): Promise<AppSettings> {
    try {
      return await fetchApi<AppSettings>('/api/settings');
    } catch {
      return {
        defaultFont: 'Calibri, sans-serif',
        defaultFontSize: 10.5,
        defaultPaperSize: 'A4',
        defaultMargins: { top: 15, bottom: 15, left: 15, right: 15 },
        defaultQuestionStyle: 'number_dot',
        defaultOptionStyle: 'grid_2x2',
        defaultEquationSize: 12,
        autosaveIntervalMs: 2000,
        theme: 'white',
        exportSettings: {
          pdfDpi: 300,
          embedFonts: true,
          showPageNumbers: true
        },
        backupSettings: {
          autoBackupDaily: true,
          maxBackupsToKeep: 5
        }
      };
    }
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    return fetchApi<AppSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
