import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ChangeInfo, ForecastRowData } from './forecast-table'

const COLORS = {
  emerald: '#059669',
  emeraldLight: '#ecfdf5',
  amberLight: '#fef3c7',
  redLight: '#fef2f2',
  greenLight: '#ecfdf5',
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray900: '#111827',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: 'Helvetica',
  },
  titleBlock: {
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.emerald,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.emerald,
  },
  subtitle: {
    fontSize: 7,
    color: COLORS.gray500,
  },
  table: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.emerald,
  },
  headerCell: {
    padding: '2 3',
    color: COLORS.white,
    fontSize: 5.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  rowEven: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
  },
  rowNew: {
    flexDirection: 'row',
    backgroundColor: COLORS.greenLight,
    borderBottomWidth: 0.5,
    borderBottomColor: '#a7f3d0',
  },
  rowRemoved: {
    flexDirection: 'row',
    backgroundColor: COLORS.redLight,
    borderBottomWidth: 0.5,
    borderBottomColor: '#fecaca',
  },
  cell: {
    padding: '1.5 2',
    fontSize: 5.5,
    color: COLORS.gray900,
  },
  cellUpdated: {
    padding: '1.5 2',
    fontSize: 5.5,
    color: COLORS.gray900,
    backgroundColor: COLORS.amberLight,
  },
  indexCell: {
    padding: '1.5 2',
    fontSize: 5,
    color: COLORS.gray500,
  },
})

function buildChangeMap(changes: ChangeInfo[]) {
  const updatedCells = new Set<string>()
  const newRows = new Set<number>()
  const removedRows = new Set<number>()

  for (const c of changes) {
    if (c.changeType === 'updated' && c.field !== null && c.rowIndex !== null) {
      updatedCells.add(`${c.rowIndex}::${c.field}`)
    } else if (c.changeType === 'new' && c.rowIndex !== null) {
      newRows.add(c.rowIndex)
    } else if (c.changeType === 'removed' && c.rowIndex !== null) {
      removedRows.add(c.rowIndex)
    }
  }

  return { updatedCells, newRows, removedRows }
}

function getRowStyle(rowIndex: number, newRows: Set<number>, removedRows: Set<number>) {
  if (newRows.has(rowIndex)) return styles.rowNew
  if (removedRows.has(rowIndex)) return styles.rowRemoved
  return undefined
}

function getRowBaseStyle(rowIndex: number) {
  return rowIndex % 2 === 0 ? styles.row : styles.rowEven
}

interface ForecastPDFProps {
  headers: string[]
  rows: ForecastRowData[]
  changes: ChangeInfo[]
  version: number | null
}

export function ForecastPDF({ headers, rows, changes, version }: ForecastPDFProps) {
  const { updatedCells, newRows, removedRows } = buildChangeMap(changes)

  const totalCols = headers.length + 1
  const indexWidth = totalCols > 15 ? '4%' : '6%'
  const headerWidth = `${(100 - parseFloat(indexWidth)) / headers.length}%`

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.titleBlock}>
          <View>
            <Text style={styles.title}>Forecast Data {version ? `v${version}` : ''}</Text>
          </View>
          <Text style={styles.subtitle}>
            Generated {new Date().toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.headerRow} wrap={false}>
            <Text style={[styles.headerCell, { width: indexWidth }]}>#</Text>
            {headers.map((header) => (
              <Text key={header} style={[styles.headerCell, { width: headerWidth }]}>
                {header}
              </Text>
            ))}
          </View>

          {/* Data rows */}
          {rows.map((row) => {
            const rowIsNew = newRows.has(row.rowIndex)
            const rowIsRemoved = removedRows.has(row.rowIndex)
            const rowStyle = rowIsNew
              ? styles.rowNew
              : rowIsRemoved
                ? styles.rowRemoved
                : undefined
            const baseStyle = rowStyle || (row.rowIndex % 2 === 0 ? styles.row : styles.rowEven)

            return (
              <View key={row.id} style={baseStyle} wrap={false}>
                <Text style={[styles.indexCell, { width: indexWidth }]}>
                  {rowIsNew ? '+' : rowIsRemoved ? '-' : ''}
                  {row.rowIndex + 1}
                </Text>
                {headers.map((header) => {
                  const value = row.parsedData[header] ?? ''
                  const isUpdated = updatedCells.has(`${row.rowIndex}::${header}`)
                  return (
                    <Text
                      key={header}
                      style={[isUpdated ? styles.cellUpdated : styles.cell, { width: headerWidth }]}
                    >
                      {value}
                    </Text>
                  )
                })}
              </View>
            )
          })}

          {/* Empty state */}
          {rows.length === 0 && (
            <View style={styles.row}>
              <Text style={[{ width: '100%', textAlign: 'center', fontSize: 8, color: COLORS.gray500, padding: 10 }]}>
                No forecast data available
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
