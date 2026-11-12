/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratePdfOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  onProgress?: (progress: number, statusText: string) => void;
}

/**
 * Xuất phần tử HTML ra file PDF chất lượng cao (hỗ trợ Tiếng Việt 100% không lỗi font)
 * @param elementId ID phần tử DOM cần xuất
 * @param options Các tùy chọn xuất PDF
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: GeneratePdfOptions = {}
): Promise<void> {
  const {
    filename = 'Lich_Thi_Dau_Bang_Xep_Hang_2026.pdf',
    orientation = 'portrait',
    onProgress,
  } = options;

  onProgress?.(15, 'Đang chuẩn bị bản in tài liệu...');

  // Lưu trạng thái cuộn ban đầu
  const originalScrollTop = window.scrollY;

  try {
    onProgress?.(35, 'Đang vẽ dữ liệu & hiển thị tiếng Việt chuẩn...');

    // html2canvas chụp lại vùng DOM với độ phân giải cao scale 2 (300 DPI)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    onProgress?.(70, 'Đang phân trang tài liệu A4...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Tính toán kích thước theo tỉ lệ khổ A4
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Trang 1
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Tự động thêm các trang tiếp theo nếu nội dung dài
    let pageNum = 1;
    while (heightLeft > 2) { // dung sai 2mm tránh trang trắng thừa
      position -= pdfHeight;
      pdf.addPage();
      pageNum++;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    onProgress?.(95, 'Đang tải file PDF về máy...');
    pdf.save(filename);

    onProgress?.(100, 'Xuất file PDF thành công!');
  } finally {
    window.scrollTo(0, originalScrollTop);
  }
}

/**
 * Hỗ trợ in trực tiếp tài liệu
 */
export function printElement(elementId: string): void {
  const elem = document.getElementById(elementId);
  if (!elem) return;

  const originalContent = document.body.innerHTML;
  const printContent = elem.innerHTML;

  // Sử dụng print stylesheet hoặc iframe print để không làm mất React state
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>In Lịch Thi Đấu & Bảng Xếp Hạng</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 400);
}
