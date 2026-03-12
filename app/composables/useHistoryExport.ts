type ExportValue = string | number | boolean | null | undefined
export type ExportRow = Record<string, ExportValue>

const toCellString = (value: ExportValue): string => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

const sanitizeFilename = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')

const triggerDownload = (blob: Blob, filename: string): void => {
  if (!import.meta.client) {
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const toCsv = (rows: ExportRow[]): string => {
  if (!rows.length) {
    return ''
  }

  const headers = Object.keys(rows[0] ?? {})
  const escape = (value: ExportValue): string => `"${toCellString(value).replace(/"/g, '""')}"`

  const lines = [
    headers.map((header) => escape(header)).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))
  ]

  return lines.join('\n')
}

const toSpreadsheetXml = (rows: ExportRow[]): string => {
  if (!rows.length) {
    return ''
  }

  const headers = Object.keys(rows[0] ?? {})
  const escape = (value: ExportValue): string =>
    toCellString(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const headerXml = headers
    .map((header) => `<Cell><Data ss:Type=\"String\">${escape(header)}</Data></Cell>`)
    .join('')
  const rowsXml = rows
    .map((row) => {
      const cells = headers
        .map((header) => `<Cell><Data ss:Type=\"String\">${escape(row[header])}</Data></Cell>`)
        .join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  return `<?xml version=\"1.0\"?>
<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"
 xmlns:o=\"urn:schemas-microsoft-com:office:office\"
 xmlns:x=\"urn:schemas-microsoft-com:office:excel\"
 xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"
 xmlns:html=\"http://www.w3.org/TR/REC-html40\">
 <Worksheet ss:Name=\"History\">
  <Table>
   <Row>${headerXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`
}

export const useHistoryExport = () => {
  const exportRowsAsCsv = (rows: ExportRow[], filename: string): void => {
    if (!rows.length) {
      return
    }

    const csvContent = toCsv(rows)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    triggerDownload(blob, `${sanitizeFilename(filename)}.csv`)
  }

  const exportRowsAsXlsx = async (rows: ExportRow[], filename: string, sheetName = 'History'): Promise<void> => {
    if (!rows.length) {
      return
    }

    try {
      const moduleName = 'xlsx'
      const XLSX = (await import(/* @vite-ignore */ moduleName)) as {
        utils: {
          book_new: () => unknown
          json_to_sheet: (value: ExportRow[]) => unknown
          book_append_sheet: (workbook: unknown, worksheet: unknown, name: string) => void
        }
        write: (workbook: unknown, options: { bookType: 'xlsx'; type: 'array' }) => ArrayBuffer
      }
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(rows)

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      const workbookBytes = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      })

      const blob = new Blob([workbookBytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      triggerDownload(blob, `${sanitizeFilename(filename)}.xlsx`)
      return
    } catch {
      const xml = toSpreadsheetXml(rows)
      const blob = new Blob([xml], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      triggerDownload(blob, `${sanitizeFilename(filename)}.xlsx`)
    }
  }

  return {
    exportRowsAsCsv,
    exportRowsAsXlsx
  }
}
