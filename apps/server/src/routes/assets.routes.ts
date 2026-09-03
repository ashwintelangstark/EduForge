import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';

export const assetsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const BUCKET_NAME = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'question-assets';
let bucketChecked = false;

async function ensureBucketExists() {
  if (bucketChecked) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some(b => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    }
    bucketChecked = true;
  } catch (err) {
    // Ignore error if bucket creation fails or exists
    bucketChecked = true;
  }
}

// GET /api/assets - List all assets from Supabase Storage bucket & Database
assetsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedSubject = (req.query.subject || req.query.userSubject) as string;

    const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    
    let assetsList: any[] = [];
    if (!error && data) {
      assetsList = data.map((a: any) => ({
        id: a.id,
        name: a.filename || 'Untitled Asset',
        filename: a.filename,
        label: (a.storage_path && a.storage_path.includes('/')) ? a.storage_path.split('/')[0].toUpperCase() : 'FIGURE',
        url: a.public_url || '',
        public_url: a.public_url || '',
        storagePath: a.storage_path,
        mimeType: a.mime_type,
        sizeBytes: a.size_bytes,
        usesCount: 0,
        createdAt: a.created_at
      }));
    }

    // Scan Supabase Storage bucket root and subfolders
    try {
      await ensureBucketExists();

      // Get root items to discover subfolders dynamically
      const { data: rootItems } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 100 });
      const foldersToScan = new Set(['', 'biology', 'physics', 'chemistry', 'mathematics', 'general', 'uploads', 'questions']);

      if (rootItems) {
        rootItems.forEach(item => {
          if (!item.id && item.name && item.name !== '.emptyFolderPlaceholder') {
            foldersToScan.add(item.name);
          }
        });
      }

      for (const folder of Array.from(foldersToScan)) {
        const { data: files } = await supabase.storage.from(BUCKET_NAME).list(folder, { limit: 100 });
        if (files && files.length > 0) {
          for (const f of files) {
            if (f.name && f.name !== '.emptyFolderPlaceholder' && f.id) {
              const storagePath = folder ? `${folder}/${f.name}` : f.name;
              const existsInDb = assetsList.some(a => a.storagePath === storagePath || (a.url && a.url.includes(f.name)));
              if (!existsInDb) {
                const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
                assetsList.push({
                  id: `storage-${folder || 'root'}-${f.name}`,
                  name: f.name,
                  filename: f.name,
                  label: folder ? folder.toUpperCase() : 'FIGURE',
                  url: urlData.publicUrl,
                  public_url: urlData.publicUrl,
                  storagePath,
                  mimeType: 'image/png',
                  sizeBytes: f.metadata?.size || 0,
                  usesCount: 0,
                  createdAt: f.created_at || new Date().toISOString()
                });
              }
            }
          }
        }
      }
    } catch (storageErr) {
      console.warn('Storage bucket scan note:', storageErr);
    }

    // Also scan questions table for images to ensure Media Library displays all question diagrams
    try {
      const { data: qData } = await supabase
        .from('questions')
        .select('id, question_code, image_url, diagram_url, content, raw_text, question_options(id, option_key, content, raw_text)');
      if (qData && qData.length > 0) {
        qData.forEach((q: any, idx: number) => {
          const imgUrls: Array<{ url: string; label: string; name: string }> = [];
          if (q.image_url) imgUrls.push({ url: q.image_url, label: 'QUESTION IMAGE', name: `Question ${q.question_code || idx + 1} Image` });
          if (q.diagram_url) imgUrls.push({ url: q.diagram_url, label: 'QUESTION DIAGRAM', name: `Question ${q.question_code || idx + 1} Diagram` });

          if (Array.isArray(q.content)) {
            q.content.forEach((blk: any) => {
              const u = blk.url || blk.src || blk.imageUrl || blk.diagramUrl;
              if (u) imgUrls.push({ url: u, label: 'QUESTION BLOCK', name: `Question ${q.question_code || idx + 1} Figure` });
            });
          }

          if (typeof q.raw_text === 'string') {
            const matches = q.raw_text.match(/<img[^>]*src=["']([^"']+)["']/gi);
            if (matches) {
              matches.forEach((m: string) => {
                const srcMatch = m.match(/src=["']([^"']+)["']/i);
                if (srcMatch && srcMatch[1]) {
                  imgUrls.push({ url: srcMatch[1], label: 'STATEMENT IMAGE', name: `Question ${q.question_code || idx + 1} Statement Image` });
                }
              });
            }
          }

          if (Array.isArray(q.question_options)) {
            q.question_options.forEach((opt: any) => {
              if (Array.isArray(opt.content)) {
                opt.content.forEach((blk: any) => {
                  const u = blk.url || blk.src || blk.imageUrl;
                  if (u) imgUrls.push({ url: u, label: 'OPTION FIGURE', name: `Question ${q.question_code || idx + 1} Option ${opt.option_key?.toUpperCase()} Image` });
                });
              }
              if (typeof opt.raw_text === 'string') {
                const matches = opt.raw_text.match(/<img[^>]*src=["']([^"']+)["']/gi);
                if (matches) {
                  matches.forEach((m: string) => {
                    const srcMatch = m.match(/src=["']([^"']+)["']/i);
                    if (srcMatch && srcMatch[1]) {
                      imgUrls.push({ url: srcMatch[1], label: 'OPTION FIGURE', name: `Question ${q.question_code || idx + 1} Option ${opt.option_key?.toUpperCase()} Image` });
                    }
                  });
                }
              }
            });
          }

          imgUrls.forEach((img, uIdx) => {
            if (img.url && (img.url.startsWith('http') || img.url.startsWith('data:') || img.url.startsWith('/')) && !assetsList.some(a => a.url === img.url)) {
              assetsList.push({
                id: `q-img-${q.id || idx}-${uIdx}`,
                name: img.name,
                filename: img.name,
                label: img.label,
                url: img.url,
                public_url: img.url,
                storagePath: '',
                mimeType: 'image/png',
                sizeBytes: 0,
                usesCount: 1,
                createdAt: new Date().toISOString()
              });
            }
          });
        });
      }
    } catch (qErr) {
      console.warn('Questions image scan note:', qErr);
    }

    // Filter by subject only if specifically requested via query parameter
    if (requestedSubject && requestedSubject !== 'All' && requestedSubject !== 'all') {
      const subLower = requestedSubject.toLowerCase().trim();
      assetsList = assetsList.filter((a: any) => {
        const pathLower = (a.storagePath || '').toLowerCase();
        const nameLower = (a.name || '').toLowerCase();
        const urlLower = (a.url || '').toLowerCase();
        return pathLower.includes(subLower) || nameLower.includes(subLower) || urlLower.includes(subLower);
      });
    }

    res.json({ success: true, data: assetsList });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets - Upload image/media dumped into subject-specific folder in bucket
assetsRouter.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_PROVIDED', message: 'No upload file provided' }
      });
    }

    await ensureBucketExists();

    // Determine subject folder (e.g. biology, physics, chemistry, mathematics, or new custom subject)
    const rawSubject = (req.body.subject || req.query.subject || req.headers['x-user-subject'] || 'general') as string;
    const subjectFolder = rawSubject.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_') || 'general';

    const fileExt = file.originalname.split('.').pop() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = `${subjectFolder}/${fileName}`;

    // Upload to Supabase Storage bucket in subject-specific folder
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    let publicUrl = '';
    if (!storageError && storageData) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      publicUrl = urlData.publicUrl;
    } else {
      // Fallback data URL if storage is unconfigured
      publicUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    // Save metadata in PostgreSQL
    let assetData: any = null;
    try {
      const { data: dbData } = await supabase
        .from('assets')
        .insert({
          storage_path: storagePath,
          public_url: publicUrl,
          filename: file.originalname,
          mime_type: file.mimetype,
          size_bytes: file.size
        })
        .select()
        .single();
      assetData = dbData;
    } catch {}

    const result = {
      id: assetData?.id || `asset-${Date.now()}`,
      url: publicUrl,
      public_url: publicUrl,
      originalName: file.originalname,
      storagePath,
      subject: rawSubject,
      sizeBytes: file.size
    };

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assets/:id
assetsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data: asset } = await supabase.from('assets').select('*').eq('id', id).single();
    if (asset && asset.storage_path) {
      await supabase.storage.from(BUCKET_NAME).remove([asset.storage_path]);
    }
    await supabase.from('assets').delete().eq('id', id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
