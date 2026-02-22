// Reusable PDF export utilities
import { createRoot, Root } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  filename: string;
  scale?: number;
  orientation?: 'p' | 'l';
  format?: 'a4' | 'letter';
}

/**
 * Create a hidden container for rendering React components off-screen
 */
export const createHiddenContainer = (): HTMLElement => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0px';
  container.style.zIndex = '-1';
  document.body.appendChild(container);
  return container;
};

/**
 * Remove a container from the DOM
 */
export const removeContainer = (container: HTMLElement, root?: Root): void => {
  if (root) {
    root.unmount();
  }
  if (container.parentNode) {
    document.body.removeChild(container);
  }
};

/**
 * Render a React component in a hidden container
 */
export const renderComponentOffScreen = async (
  component: React.ReactElement,
  renderDelay: number = 300
): Promise<{ container: HTMLElement; root: Root; element: HTMLElement }> => {
  const container = createHiddenContainer();
  const root = createRoot(container);

  await new Promise<void>(resolve => {
    root.render(component);
    // Give browser time to render fonts and layout
    setTimeout(resolve, renderDelay);
  });

  const element = container.firstChild as HTMLElement;
  return { container, root, element };
};

/**
 * Capture an HTML element as a canvas using html2canvas
 */
export const captureAsCanvas = async (
  element: HTMLElement,
  scale: number = 2
): Promise<HTMLCanvasElement> => {
  return await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
};

/**
 * Convert a canvas to a PDF and handle multi-page content
 */
export const canvasToPDF = (
  canvas: HTMLCanvasElement,
  options: PDFExportOptions
): jsPDF => {
  const { orientation = 'p', format = 'a4' } = options;
  const doc = new jsPDF(orientation, 'mm', format);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const imgData = canvas.toDataURL('image/png');

  // Handle multi-page if content is taller than one page
  let yOffset = 0;
  while (yOffset < imgHeight) {
    if (yOffset > 0) {
      doc.addPage();
    }
    doc.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
    yOffset += pageHeight;
  }

  return doc;
};

/**
 * Main function to export a React component as PDF
 * @param component - React component to render
 * @param options - PDF export options
 * @param renderDelay - Time to wait for rendering (ms)
 */
export const exportComponentAsPDF = async (
  component: React.ReactElement,
  options: PDFExportOptions,
  renderDelay: number = 300
): Promise<void> => {
  let container: HTMLElement | null = null;
  let root: Root | null = null;

  try {
    // 1. Render component off-screen
    const rendered = await renderComponentOffScreen(component, renderDelay);
    container = rendered.container;
    root = rendered.root;

    // 2. Capture as canvas
    const canvas = await captureAsCanvas(rendered.element, options.scale);

    // 3. Convert to PDF
    const doc = canvasToPDF(canvas, options);

    // 4. Save PDF
    doc.save(options.filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  } finally {
    // 5. Clean up
    if (container && root) {
      removeContainer(container, root);
    }
  }
};

/**
 * Generate a standardized PDF filename
 */
export const generatePDFFilename = (
  type: string,
  identifier: string,
  date?: Date | string
): string => {
  const dateStr = date 
    ? (typeof date === 'string' ? date : date.toISOString().slice(0, 10))
    : new Date().toISOString().slice(0, 10);
  
  // Sanitize identifier (remove special characters)
  const sanitized = identifier.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  return `${type}-${sanitized}-${dateStr}.pdf`;
};
