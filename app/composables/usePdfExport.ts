import { ref } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export function usePdfExport() {
  const isExportingPdf = ref(false)
  const pdfExportError = ref<string | null>(null)

  const downloadPdf = async (elementId: string, filename: string) => {
    try {
      isExportingPdf.value = true
      pdfExportError.value = null
      
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Could not find element to export')
      }

      // Capture the element using html2canvas
      // We set backgroundColor to null to capture the transparent glass look properly
      // although PDF backgrounds are white by default, so we might want to capture it over a dark background.
      // Let's force a dark background for the capture so the white text is readable.
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        backgroundColor: '#020617', // Match the Tailwind slate-950 background
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
           // We can manipulate the cloned doc before capturing if needed
           const clonedElement = clonedDoc.getElementById(elementId)
           if (clonedElement) {
             // ensure it has some padding
             clonedElement.style.padding = '20px'
           }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      
      // Calculate PDF dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      
      // If the content is longer than one page, add pages
      let heightLeft = pdfHeight - pdf.internal.pageSize.getHeight()
      let position = -pdf.internal.pageSize.getHeight()

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      pdf.save(filename)
      
    } catch (error: any) {
      console.error('PDF Export Error:', error)
      pdfExportError.value = error.message || 'Failed to export PDF'
    } finally {
      isExportingPdf.value = false
    }
  }

  return {
    isExportingPdf,
    pdfExportError,
    downloadPdf
  }
}
