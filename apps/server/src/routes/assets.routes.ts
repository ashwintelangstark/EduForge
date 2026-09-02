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
      const { data: qData } = await supabase.from('questions').select('id, image_url, diagram_url, content');
      if (qData && qData.length > 0) {
        qData.forEach((q: any, idx: number) => {
          const imgUrls: string[] = [q.image_url, q.diagram_url].filter(Boolean);
          if (Array.isArray(q.content)) {
            q.content.forEach((blk: any) => {
              if (blk.url) imgUrls.push(blk.url);
              if (blk.src) imgUrls.push(blk.src);
              if (blk.imageUrl) imgUrls.push(blk.imageUrl);
              if (blk.diagramUrl) imgUrls.push(blk.diagramUrl);
            });
          }
          imgUrls.forEach((url: string, uIdx: number) => {
            if (url && (url.startsWith('http') || url.startsWith('data:')) && !assetsList.some(a => a.url === url)) {
              assetsList.push({
                id: `q-img-${q.id || idx}-${uIdx}`,
                name: `Question Image ${idx + 1}`,
                filename: `question_img_${idx + 1}`,
                label: 'QUESTION DIAGRAM',
                url: url,
                public_url: url,
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
