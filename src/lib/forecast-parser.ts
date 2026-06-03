import * as XLSX from 'xlsx'

export interface ParsedRow {
  rowIndex: number
  voyageNumber: string | null
  containerNumber: string | null
  shipmentId: string | null
  bookingRef: string | null
  data: Record<string, string>
}

export interface ParsedResult {
  headers: string[]
  rows: ParsedRow[]
  identifierColumns: string[]
}

export interface ChangeRecord {
  changeType: 'updated' | 'new' | 'removed'
  field: string | null
  oldValue: string | null
  newValue: string | null
  voyageNumber: string | null
  containerNumber: string | null
  shipmentId: string | null
  bookingRef: string | null
  rowIndex: number | null
}

export interface ChangeSummary {
  updates: number
  newRows: number
  removedRows: number
}

const IDENTIFIER_PATTERNS: Record<string, RegExp[]> = {
  voyageNumber: [/voyage/i, /voy/i, /vessel/i, /vessel\s*name/i],
  containerNumber: [/container/i, /cntr/i, /ctnr/i, /container\s*no/i, /container\s*#/i],
  shipmentId: [/shipment/i, /shpmt/i, /shipment\s*id/i, /shipment\s*#/i],
  bookingRef: [/booking/i, /bk\s*ref/i, /reference/i, /booking\s*ref/i, /book\s*#/i],
}

export function parseExcel(buffer: ArrayBuffer): ParsedResult {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { headers: [], rows: [], identifierColumns: [] }
  }
  const worksheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null | undefined>>(
    worksheet,
    { defval: '' }
  )

  if (rawRows.length === 0) {
    return { headers: [], rows: [], identifierColumns: [] }
  }

  const headers = Object.keys(rawRows[0])
  const identifierColumns = detectIdentifierColumns(headers)

  const rows: ParsedRow[] = rawRows.map((raw, index) => {
    const data: Record<string, string> = {}
    for (const key of headers) {
      const val = raw[key]
      data[key] = val === null || val === undefined ? '' : String(val)
    }
    return {
      rowIndex: index,
      voyageNumber: extractIdentifier(data, 'voyageNumber', identifierColumns),
      containerNumber: extractIdentifier(data, 'containerNumber', identifierColumns),
      shipmentId: extractIdentifier(data, 'shipmentId', identifierColumns),
      bookingRef: extractIdentifier(data, 'bookingRef', identifierColumns),
      data,
    }
  })

  return { headers, rows, identifierColumns }
}

function detectIdentifierColumns(headers: string[]): string[] {
  const found: string[] = []
  const matched = new Set<string>()

  for (const [field, patterns] of Object.entries(IDENTIFIER_PATTERNS)) {
    for (const header of headers) {
      if (matched.has(header)) continue
      if (patterns.some((p) => p.test(header))) {
        found.push(field)
        matched.add(header)
        break
      }
    }
  }

  return found
}

function extractIdentifier(
  data: Record<string, string>,
  field: string,
  identifierColumns: string[]
): string | null {
  if (!identifierColumns.includes(field)) return null
  const patterns = IDENTIFIER_PATTERNS[field]
  if (!patterns) return null
  for (const key of Object.keys(data)) {
    if (patterns.some((p) => p.test(key))) {
      const val = data[key]?.trim()
      return val || null
    }
  }
  return null
}

const IDENTIFIER_FIELDS: (keyof ParsedRow)[] = [
  'voyageNumber',
  'containerNumber',
  'shipmentId',
  'bookingRef',
]

export function detectChanges(
  newRows: ParsedRow[],
  prevRows: ParsedRow[]
): { changes: ChangeRecord[]; summary: ChangeSummary } {
  const changes: ChangeRecord[] = []
  const matchedPrevIndices = new Set<number>()

  // Build lookup maps for O(1) matching
  const identifierMaps = IDENTIFIER_FIELDS.map((idField) => {
    const map = new Map<string, ParsedRow>()
    for (const row of prevRows) {
      const val = row[idField] as string | null
      if (val && !map.has(val)) {
        map.set(val, row)
      }
    }
    return map
  })

  for (const newRow of newRows) {
    let prevRow: ParsedRow | null = null
    for (let i = 0; i < IDENTIFIER_FIELDS.length; i++) {
      const val = newRow[IDENTIFIER_FIELDS[i]] as string | null
      if (val) {
        prevRow = identifierMaps[i].get(val) ?? null
        if (prevRow) break
      }
    }

    if (prevRow) {
      matchedPrevIndices.add(prevRow.rowIndex)
      for (const key of Object.keys(newRow.data)) {
        const newVal = newRow.data[key] ?? ''
        const prevVal = prevRow.data[key] ?? ''
        if (newVal !== prevVal) {
          changes.push({
            changeType: 'updated',
            field: key,
            oldValue: prevVal,
            newValue: newVal,
            voyageNumber: newRow.voyageNumber ?? prevRow.voyageNumber,
            containerNumber: newRow.containerNumber ?? prevRow.containerNumber,
            shipmentId: newRow.shipmentId ?? prevRow.shipmentId,
            bookingRef: newRow.bookingRef ?? prevRow.bookingRef,
            rowIndex: newRow.rowIndex,
          })
        }
      }
    } else {
      changes.push({
        changeType: 'new',
        field: null,
        oldValue: null,
        newValue: null,
        voyageNumber: newRow.voyageNumber,
        containerNumber: newRow.containerNumber,
        shipmentId: newRow.shipmentId,
        bookingRef: newRow.bookingRef,
        rowIndex: newRow.rowIndex,
      })
    }
  }

  for (const prevRow of prevRows) {
    if (!matchedPrevIndices.has(prevRow.rowIndex)) {
      changes.push({
        changeType: 'removed',
        field: null,
        oldValue: null,
        newValue: null,
        voyageNumber: prevRow.voyageNumber,
        containerNumber: prevRow.containerNumber,
        shipmentId: prevRow.shipmentId,
        bookingRef: prevRow.bookingRef,
        rowIndex: prevRow.rowIndex,
      })
    }
  }

  const summary: ChangeSummary = {
    updates: changes.filter((c) => c.changeType === 'updated').length,
    newRows: changes.filter((c) => c.changeType === 'new').length,
    removedRows: changes.filter((c) => c.changeType === 'removed').length,
  }

  return { changes, summary }
}
