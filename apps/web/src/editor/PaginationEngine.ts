import { DocumentModel, DocumentBlock, DocumentSection } from '@eduforge/shared';

export interface ColumnLayout {
  columnIndex: number;
  blocks: {
    sectionId: string;
    sectionTitle?: string;
    isSectionHeader?: boolean;
    block: DocumentBlock;
  }[];
}

export interface PageLayout {
  pageNumber: number;
  isFirstPage: boolean;
  columns: ColumnLayout[];
}

// Approximate block heights in pixels for pagination estimation
function estimateBlockHeight(block: DocumentBlock): number {
  if (!block) return 30;
  switch (block.type) {
    case 'paragraph': {
      const runs = block.runs || [];
      const textLen = runs.reduce((acc, r) => acc + (r?.text?.length || 0), 0);
      const lines = Math.max(1, Math.ceil(textLen / 55));
      return lines * 22 + 10;
    }
    case 'heading':
      return 36;
    case 'equation':
      return 55;
    case 'image':
      return (block.height || 180) + 20;
    case 'table':
      return (block.rows || 3) * 32 + 20;
    case 'shape':
      return (block.height || 80) + 15;
    case 'wordart':
      return 60;
    case 'page_break':
      return 99999; // force new page
    case 'horizontal_line':
      return 15;
    case 'section_header':
      return 45;
    case 'question': {
      const q = block.question;
      if (!q) return 40;
      const qTextLen = q.rawText?.length || 50;
      const qLines = Math.max(1, Math.ceil(qTextLen / 50));
      const optCount = q.options?.length || 4;
      const optHeight = q.optionLayout === 'grid_2x2' ? 55 : optCount * 26;
      const imgHeight = (q.imageUrl || q.diagramUrl || q.diagramSvg) ? 75 : 0;
      const scaleMultiplier = (block as any).scale ? (block as any).scale : ((block as any).fontSize ? (block as any).fontSize / 10.5 : 1);
      return Math.round((qLines * 22 + optHeight + 35 + imgHeight) * scaleMultiplier);
    }
    default:
      return 30;
  }
}

export function paginateDocument(doc: DocumentModel): PageLayout[] {
  if (!doc) {
    return [{ pageNumber: 1, isFirstPage: true, columns: [{ columnIndex: 0, blocks: [] }] }];
  }

  const settings = doc.settings || {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 15, bottom: 15, left: 15, right: 15 },
    columns: 1,
    columnGap: 0,
    columnDivider: false,
    defaultFont: 'Calibri, sans-serif',
    defaultFontSize: 11,
    questionSpacing: 6,
    optionSpacing: 4,
    lineSpacing: 1.15,
    paragraphSpacing: 4
  };

  const margins = settings.margins || { top: 15, bottom: 15, left: 15, right: 15 };
  const metadata = doc.metadata || {};
  const sections = Array.isArray(doc.sections) ? doc.sections : [];

  const isTwoColumn = false; // Always 1 Single Full A4 Paper Layout
  const mmToPx = 3.7795;
  const pageHeightPx = 297 * mmToPx; // ~1123px
  const topMarginPx = (margins.top ?? 15) * mmToPx;
  const bottomMarginPx = (margins.bottom ?? 15) * mmToPx;
  const footerHeightPx = 35;

  // Header takes ~180px on first page if institute/instructions exist
  const firstPageHeaderHeightPx = metadata.instituteName ? 170 : 80;

  const firstPageUsableHeight = pageHeightPx - topMarginPx - bottomMarginPx - footerHeightPx - firstPageHeaderHeightPx;
  const subsequentPageUsableHeight = pageHeightPx - topMarginPx - bottomMarginPx - footerHeightPx;

  const pages: PageLayout[] = [];
  let currentPageIndex = 0;
  let currentColumnIndex = 0;
  let currentColumnHeight = 0;

  const initPage = (pageIndex: number): PageLayout => {
    return {
      pageNumber: pageIndex + 1,
      isFirstPage: pageIndex === 0,
      columns: isTwoColumn ? [{ columnIndex: 0, blocks: [] }, { columnIndex: 1, blocks: [] }] : [{ columnIndex: 0, blocks: [] }]
    };
  };

  pages.push(initPage(currentPageIndex));

  const advanceColumnOrPage = () => {
    if (isTwoColumn && currentColumnIndex === 0) {
      // Move to column 2 of same page
      currentColumnIndex = 1;
      currentColumnHeight = 0;
    } else {
      // Move to new page
      currentPageIndex++;
      currentColumnIndex = 0;
      currentColumnHeight = 0;
      pages.push(initPage(currentPageIndex));
    }
  };

  const getAvailableHeight = () => {
    const maxHeight = currentPageIndex === 0 ? firstPageUsableHeight : subsequentPageUsableHeight;
    return maxHeight - currentColumnHeight;
  };

  for (const section of sections) {
    if (!section) continue;

    // Add section header block
    const secHeaderBlock: DocumentBlock = {
      id: `sec-hdr-${section.id || Date.now()}`,
      type: 'section_header',
      title: section.title,
      instructions: section.instructions,
      totalMarks: section.marks
    };

    const secHeaderHeight = 45;
    if (getAvailableHeight() < secHeaderHeight && currentColumnHeight > 0) {
      advanceColumnOrPage();
    }

    pages[currentPageIndex].columns[currentColumnIndex].blocks.push({
      sectionId: section.id || 'default-sec',
      sectionTitle: section.title,
      isSectionHeader: true,
      block: secHeaderBlock
    });
    currentColumnHeight += secHeaderHeight;

    const blocks = Array.isArray(section.blocks) ? section.blocks : [];

    // Process section blocks
    for (const block of blocks) {
      if (!block) continue;

      if (block.type === 'page_break') {
        // Explicit page break: jump to next page
        currentPageIndex++;
        currentColumnIndex = 0;
        currentColumnHeight = 0;
        pages.push(initPage(currentPageIndex));
        continue;
      }

      // If block explicitly specifies column placement in two-column mode
      if (isTwoColumn && block.column !== undefined && block.column !== 'auto') {
        if (block.column === 1 && currentColumnIndex === 0) {
          advanceColumnOrPage();
        } else if (block.column === 0 && currentColumnIndex === 1) {
          advanceColumnOrPage();
        }
      }

      const blockHeight = estimateBlockHeight(block);

      // If block does not fit in current column and we're not at the very top of a blank column
      if (blockHeight > getAvailableHeight() && currentColumnHeight > 30) {
        advanceColumnOrPage();
      }

      pages[currentPageIndex].columns[currentColumnIndex].blocks.push({
        sectionId: section.id || 'default-sec',
        block
      });
      currentColumnHeight += blockHeight;
    }
  }

  // Ensure at least 1 page
  if (pages.length === 0) {
    pages.push(initPage(0));
  }

  return pages;
}
