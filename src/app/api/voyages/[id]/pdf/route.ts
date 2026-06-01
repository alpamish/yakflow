import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

const execFileAsync = promisify(execFile)

const REVENUE_TYPES: Record<string, string> = {
  freight_income: 'Freight Income',
  slot_revenue: 'Slot Revenue',
  surcharges: 'Surcharges',
  handling_income: 'Handling Income',
  service_charges: 'Service Charges',
}

const EXPENSE_TYPES: Record<string, string> = {
  ocean_freight: 'Ocean Freight',
  port_charges: 'Port Charges',
  fuel_costs: 'Fuel Costs',
  bunker_costs: 'Bunker Costs',
  canal_fees: 'Canal Fees',
  rail_costs: 'Rail Costs',
  customs: 'Customs',
  x_ray: 'X-Ray',
  terminal_handling: 'Terminal Handling',
  agency_costs: 'Agency Costs',
  documentation: 'Documentation',
  crew_costs: 'Crew Costs',
  miscellaneous: 'Miscellaneous',
}

function getLabel(map: Record<string, string>, key: string): string {
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id } = await params

    // Fetch base currency from organization
    const orgData = await db.organization.findUnique({ where: { id: orgId }, select: { baseCurrency: true } })
    const baseCurrency = orgData?.baseCurrency || 'USD'

    // Fetch voyage data
    const voyage = await db.voyage.findUnique({
      where: { id, organizationId: orgId },
      include: {
        teuRecords: { orderBy: { recordedAt: 'desc' } },
        revenues: true,
        expenses: {
          include: {
            vendor: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    // Calculate data
    const totalRevenue = voyage.revenues.reduce((s, r) => s + (r.amount || 0), 0)
    const totalExpenses = voyage.expenses.reduce((s, e) => s + (e.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    const latestTeu = voyage.teuRecords.length > 0 ? voyage.teuRecords[0] : null

    // Group expenses by type
    const expensesByType: Record<string, { total: number; byCurrency: Record<string, number> }> = {}
    voyage.expenses.forEach(exp => {
      const type = exp.expenseType
      if (!expensesByType[type]) expensesByType[type] = { total: 0, byCurrency: {} }
      expensesByType[type].total += exp.amount || 0
      if (!expensesByType[type].byCurrency[exp.currency]) expensesByType[type].byCurrency[exp.currency] = 0
      expensesByType[type].byCurrency[exp.currency] += exp.amount
    })

    // Group revenues by type
    const revenuesByType: Record<string, { total: number; byCurrency: Record<string, number> }> = {}
    voyage.revenues.forEach(rev => {
      const type = rev.revenueType
      if (!revenuesByType[type]) revenuesByType[type] = { total: 0, byCurrency: {} }
      revenuesByType[type].total += rev.amount || 0
      if (!revenuesByType[type].byCurrency[rev.currency]) revenuesByType[type].byCurrency[rev.currency] = 0
      revenuesByType[type].byCurrency[rev.currency] += rev.amount
    })

    // Get all unique currencies
    const allExpenseCurrencies = [...new Set(voyage.expenses.map(e => e.currency))].sort()
    const allRevenueCurrencies = [...new Set(voyage.revenues.map(r => r.currency))].sort()

    // Sort by total descending
    const sortedExpenseTypes = Object.entries(expensesByType).sort(([, a], [, b]) => b.total - a.total)
    const sortedRevenueTypes = Object.entries(revenuesByType).sort(([, a], [, b]) => b.total - a.total)

    // Calculate totals per currency
    const expenseTotalsByCurrency: Record<string, number> = {}
    allExpenseCurrencies.forEach(c => { expenseTotalsByCurrency[c] = 0 })
    let expenseGrandTotal = 0
    sortedExpenseTypes.forEach(([, data]) => {
      expenseGrandTotal += data.total
      allExpenseCurrencies.forEach(c => {
        expenseTotalsByCurrency[c] += data.byCurrency[c] || 0
      })
    })

    const revenueTotalsByCurrency: Record<string, number> = {}
    allRevenueCurrencies.forEach(c => { revenueTotalsByCurrency[c] = 0 })
    let revenueGrandTotal = 0
    sortedRevenueTypes.forEach(([, data]) => {
      revenueGrandTotal += data.total
      allRevenueCurrencies.forEach(c => {
        revenueTotalsByCurrency[c] += data.byCurrency[c] || 0
      })
    })

    // Prepare data JSON
    const pdfData = {
      voyageNumber: voyage.voyageNumber,
      vesselName: voyage.vesselName,
      sailingRoute: voyage.sailingRoute,
      departurePort: voyage.departurePort,
      arrivalPort: voyage.arrivalPort,
      etd: voyage.etd,
      eta: voyage.eta,
      status: voyage.status,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      latestTeu: latestTeu ? {
        totalTEUs: latestTeu.totalTEUs,
        totalContainers: latestTeu.totalContainers,
        loadedTEUs: latestTeu.loadedTEUs,
        emptyTEUs: latestTeu.emptyTEUs,
        teuUtilization: latestTeu.teuUtilization,
      } : null,
      sortedExpenseTypes: sortedExpenseTypes.map(([key, val]) => ({
        key,
        label: getLabel(EXPENSE_TYPES, key),
        total: val.total,
        byCurrency: val.byCurrency,
      })),
      sortedRevenueTypes: sortedRevenueTypes.map(([key, val]) => ({
        key,
        label: getLabel(REVENUE_TYPES, key),
        total: val.total,
        byCurrency: val.byCurrency,
      })),
      allExpenseCurrencies,
      allRevenueCurrencies,
      expenseTotalsByCurrency,
      revenueTotalsByCurrency,
      expenseGrandTotal,
      revenueGrandTotal,
      baseCurrency,
    }

    // Write data JSON to temp file
    const dataPath = join(tmpdir(), `voyage_data_${id}.json`)
    const outputPath = join(tmpdir(), `voyage_pdf_${id}.pdf`)
    const scriptPath = join(tmpdir(), `voyage_gen_${id}.py`)

    await writeFile(dataPath, JSON.stringify(pdfData), 'utf-8')
    await writeFile(scriptPath, generatePythonScript(dataPath, outputPath), 'utf-8')

    try {
      await execFileAsync('python3', [scriptPath], { timeout: 30000 })
    } finally {
      // Clean up temp files
      await unlink(scriptPath).catch(() => {})
      await unlink(dataPath).catch(() => {})
    }

    // Read the generated PDF
    const pdfBuffer = await readFile(outputPath)
    await unlink(outputPath).catch(() => {})

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="voyage-${voyage.voyageNumber}-summary.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generatePythonScript(dataPath: string, outputPath: string): string {
  // Use Python string formatting that avoids JS template literal conflicts
  return `#!/usr/bin/env python3
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Register fonts (DejaVu Serif for full Unicode/currency symbol support)
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
registerFontFamily('DejaVuSerif', normal='DejaVuSerif', bold='DejaVuSerif-Bold')

# Color Palette
ACCENT       = colors.HexColor('#1f7692')
TEXT_PRIMARY  = colors.HexColor('#1b1a18')
TEXT_MUTED    = colors.HexColor('#7a766f')
BG_SURFACE   = colors.HexColor('#e5e3df')
BG_PAGE      = colors.HexColor('#edecea')
EMERALD      = colors.HexColor('#10b981')
RED          = colors.HexColor('#ef4444')
EMERALD_BG   = colors.HexColor('#d1fae5')
RED_BG       = colors.HexColor('#fee2e2')
TOTAL_ROW_BG = colors.HexColor('#1f7692')

# Load data
with open(${JSON.stringify(dataPath)}, 'r') as f:
    data = json.load(f)

output_path = ${JSON.stringify(outputPath)}

# Styles
title_style = ParagraphStyle(
    name='Title', fontName='DejaVuSerif', fontSize=22,
    leading=28, textColor=ACCENT, alignment=TA_LEFT, spaceAfter=4
)
subtitle_style = ParagraphStyle(
    name='Subtitle', fontName='DejaVuSerif', fontSize=12,
    leading=16, textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=12
)
section_style = ParagraphStyle(
    name='Section', fontName='DejaVuSerif', fontSize=14,
    leading=18, textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceBefore=16, spaceAfter=8
)
header_style = ParagraphStyle(
    name='TableHeader', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=colors.white, alignment=TA_CENTER
)
header_left_style = ParagraphStyle(
    name='TableHeaderLeft', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=colors.white, alignment=TA_LEFT
)
cell_style = ParagraphStyle(
    name='TableCell', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
cell_right_style = ParagraphStyle(
    name='TableCellRight', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=TEXT_PRIMARY, alignment=TA_RIGHT
)
cell_bold_style = ParagraphStyle(
    name='TableCellBold', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
cell_bold_right_style = ParagraphStyle(
    name='TableCellBoldRight', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=TEXT_PRIMARY, alignment=TA_RIGHT
)
total_cell_style = ParagraphStyle(
    name='TotalCell', fontName='DejaVuSerif', fontSize=10,
    leading=13, textColor=colors.white, alignment=TA_LEFT
)
total_cell_right_style = ParagraphStyle(
    name='TotalCellRight', fontName='DejaVuSerif', fontSize=10,
    leading=13, textColor=colors.white, alignment=TA_RIGHT
)
metric_label_style = ParagraphStyle(
    name='MetricLabel', fontName='DejaVuSerif', fontSize=9,
    leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER
)
metric_value_style = ParagraphStyle(
    name='MetricValue', fontName='DejaVuSerif', fontSize=14,
    leading=18, textColor=TEXT_PRIMARY, alignment=TA_CENTER
)
footer_style = ParagraphStyle(
    name='Footer', fontName='DejaVuSerif', fontSize=8,
    leading=10, textColor=TEXT_MUTED, alignment=TA_CENTER
)
info_style = ParagraphStyle(
    name='Info', fontName='DejaVuSerif', fontSize=10,
    leading=14, textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=8
)

CURRENCY_SYMBOLS = {
    'USD': '$',
    'EUR': '\u20ac',
    'GBP': '\u00a3',
    'RUB': '\u20bd',
    'CNY': '\u00a5',
    'JPY': '\u00a5',
    'KRW': '\u20a9',
    'INR': '\u20b9',
    'CHF': 'CHF',
    'CAD': 'C$',
    'AUD': 'A$',
    'NZD': 'NZ$',
    'SGD': 'S$',
    'HKD': 'HK$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': '\u007a\u0142',
    'CZK': 'K\u010d',
    'HUF': 'Ft',
    'TRY': '\u20ba',
    'BRL': 'R$',
    'MXN': 'MX$',
    'ZAR': 'R',
    'AED': 'AED',
    'SAR': 'SAR',
    'THB': '\u0e3f',
    'MYR': 'RM',
    'IDR': 'Rp',
    'PHP': '\u20b1',
    'VND': '\u20ab',
    'TWD': 'NT$',
    'ILS': '\u20aa',
    'EGP': 'E\u00a3',
    'NGN': '\u20a6',
    'KES': 'KSh',
    'GHS': '\u20b5',
}

def get_symbol(currency_code):
    return CURRENCY_SYMBOLS.get(currency_code, currency_code + ' ')

def fmt(amount, currency='USD'):
    symbol = get_symbol(currency)
    if abs(amount) >= 10000:
        return symbol + "{:,.0f}".format(amount)
    return symbol + "{:,.2f}".format(amount)

def pct_str(val):
    return "{:.1f}%".format(val)

# Page setup
page_width, page_height = A4
margin = 0.75 * inch
available_width = page_width - 2 * margin

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=margin,
    rightMargin=margin,
    topMargin=margin,
    bottomMargin=0.6 * inch,
)

story = []

# TITLE SECTION
story.append(Paragraph('<b>Voyage Financial Summary</b>', title_style))
story.append(Paragraph(data["voyageNumber"] + " | " + data["vesselName"], subtitle_style))

# Voyage info line
info_parts = []
if data.get("sailingRoute"):
    info_parts.append("Route: " + data["sailingRoute"])
if data.get("departurePort") and data.get("arrivalPort"):
    info_parts.append(data["departurePort"] + " \\u2192 " + data["arrivalPort"])
if data.get("etd"):
    info_parts.append("ETD: " + data["etd"][:10])
if info_parts:
    story.append(Paragraph(" | ".join(info_parts), info_style))

story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=12))

# KEY METRICS ROW
metrics_data = [[
    Paragraph('TOTAL REVENUE', metric_label_style),
    Paragraph('TOTAL EXPENSES', metric_label_style),
    Paragraph('NET PROFIT', metric_label_style),
    Paragraph('PROFIT MARGIN', metric_label_style),
]]
rev_style = ParagraphStyle(name='RevVal', fontName='DejaVuSerif', fontSize=14, leading=18, textColor=EMERALD, alignment=TA_CENTER)
exp_style = ParagraphStyle(name='ExpVal', fontName='DejaVuSerif', fontSize=14, leading=18, textColor=RED, alignment=TA_CENTER)
profit_color = EMERALD if data["netProfit"] >= 0 else RED
profit_style = ParagraphStyle(name='ProfitVal', fontName='DejaVuSerif', fontSize=14, leading=18, textColor=profit_color, alignment=TA_CENTER)
margin_style = ParagraphStyle(name='MarginVal', fontName='DejaVuSerif', fontSize=14, leading=18, textColor=profit_color, alignment=TA_CENTER)

metrics_data.append([
    Paragraph('<b>' + fmt(data["totalRevenue"], data["baseCurrency"]) + '</b>', rev_style),
    Paragraph('<b>' + fmt(data["totalExpenses"], data["baseCurrency"]) + '</b>', exp_style),
    Paragraph('<b>' + fmt(data["netProfit"], data["baseCurrency"]) + '</b>', profit_style),
    Paragraph('<b>' + pct_str(data["profitMargin"]) + '</b>', margin_style),
])

col_w = available_width / 4
metrics_table = Table(metrics_data, colWidths=[col_w]*4, hAlign='CENTER')
profit_bg = EMERALD_BG if data["netProfit"] >= 0 else RED_BG
metrics_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BG_PAGE),
    ('BACKGROUND', (0, 1), (0, 1), EMERALD_BG),
    ('BACKGROUND', (1, 1), (1, 1), RED_BG),
    ('BACKGROUND', (2, 1), (2, 1), profit_bg),
    ('BACKGROUND', (3, 1), (3, 1), profit_bg),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('BOX', (0, 0), (-1, -1), 0.5, BG_SURFACE),
    ('LINEAFTER', (0, 0), (-2, -1), 0.5, BG_SURFACE),
]))
story.append(metrics_table)
story.append(Spacer(1, 18))

# TEU INFO
if data.get("latestTeu"):
    teu = data["latestTeu"]
    teu_data = [[
        Paragraph('TEUs', metric_label_style),
        Paragraph('Loaded', metric_label_style),
        Paragraph('Empty', metric_label_style),
        Paragraph('Utilization', metric_label_style),
    ], [
        Paragraph('<b>' + str(teu["totalTEUs"]) + '</b>', metric_value_style),
        Paragraph('<b>' + str(teu["loadedTEUs"]) + '</b>', metric_value_style),
        Paragraph('<b>' + str(teu["emptyTEUs"]) + '</b>', metric_value_style),
        Paragraph('<b>' + pct_str(teu["teuUtilization"] or 0) + '</b>', metric_value_style),
    ]]
    teu_table = Table(teu_data, colWidths=[col_w]*4, hAlign='CENTER')
    teu_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_PAGE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, BG_SURFACE),
        ('LINEAFTER', (0, 0), (-2, -1), 0.5, BG_SURFACE),
    ]))
    story.append(teu_table)
    story.append(Spacer(1, 18))

# REVENUE SUMMARY TABLE
story.append(Paragraph('<b>Revenue Breakdown</b>', section_style))

rev_currencies = data["allRevenueCurrencies"]
type_w = available_width * 0.25
base_w = available_width * 0.18
pct_w = available_width * 0.10
n_curr = max(len(rev_currencies), 1)
curr_w = (available_width - type_w - base_w - pct_w) / n_curr if rev_currencies else 0
rev_col_widths = [type_w, base_w] + [curr_w] * len(rev_currencies) + [pct_w]

rev_header = [
    Paragraph('<b>TYPE</b>', header_left_style),
    Paragraph('<b>REVENUE (' + data['baseCurrency'] + ')</b>', header_style),
]
for c in rev_currencies:
    rev_header.append(Paragraph('<b>' + c + ' AMOUNT</b>', header_style))
rev_header.append(Paragraph('<b>% TOTAL</b>', header_style))

rev_table_data = [rev_header]

for item in data["sortedRevenueTypes"]:
    pct = (item["total"] / data["revenueGrandTotal"] * 100) if data["revenueGrandTotal"] > 0 else 0
    row = [
        Paragraph(item["label"], cell_style),
        Paragraph(fmt(item["total"], data['baseCurrency']), cell_right_style),
    ]
    for c in rev_currencies:
        val = item["byCurrency"].get(c, 0)
        row.append(Paragraph(fmt(val, c) if val else "\\u2014", cell_right_style))
    row.append(Paragraph(pct_str(pct), cell_right_style))
    rev_table_data.append(row)

rev_total_row = [
    Paragraph('<b>TOTAL</b>', total_cell_style),
    Paragraph('<b>' + fmt(data["revenueGrandTotal"], data['baseCurrency']) + '</b>', total_cell_right_style),
]
for c in rev_currencies:
    rev_total_row.append(Paragraph('<b>' + fmt(data["revenueTotalsByCurrency"].get(c, 0), c) + '</b>', total_cell_right_style))
rev_total_row.append(Paragraph('<b>100%</b>', total_cell_right_style))
rev_table_data.append(rev_total_row)

rev_table = Table(rev_table_data, colWidths=rev_col_widths, hAlign='CENTER')
rev_style_cmds = [
    ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, -1), (-1, -1), TOTAL_ROW_BG),
    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, BG_SURFACE),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('LINEABOVE', (0, -1), (-1, -1), 2, ACCENT),
]
for i in range(1, len(rev_table_data) - 1):
    bg = colors.white if i % 2 == 1 else BG_PAGE
    rev_style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
rev_table.setStyle(TableStyle(rev_style_cmds))
story.append(rev_table)
story.append(Spacer(1, 18))

# EXPENSE SUMMARY TABLE
story.append(Paragraph('<b>Expense Breakdown</b>', section_style))

exp_currencies = data["allExpenseCurrencies"]
n_curr_exp = max(len(exp_currencies), 1)
curr_w_exp = (available_width - type_w - base_w - pct_w) / n_curr_exp if exp_currencies else 0
exp_col_widths = [type_w, base_w] + [curr_w_exp] * len(exp_currencies) + [pct_w]

exp_header = [
    Paragraph('<b>TYPE</b>', header_left_style),
    Paragraph('<b>COSTS (' + data['baseCurrency'] + ')</b>', header_style),
]
for c in exp_currencies:
    exp_header.append(Paragraph('<b>' + c + ' AMOUNT</b>', header_style))
exp_header.append(Paragraph('<b>% TOTAL</b>', header_style))

exp_table_data = [exp_header]

for item in data["sortedExpenseTypes"]:
    pct = (item["total"] / data["expenseGrandTotal"] * 100) if data["expenseGrandTotal"] > 0 else 0
    row = [
        Paragraph(item["label"], cell_style),
        Paragraph(fmt(item["total"], data['baseCurrency']), cell_right_style),
    ]
    for c in exp_currencies:
        val = item["byCurrency"].get(c, 0)
        row.append(Paragraph(fmt(val, c) if val else "\\u2014", cell_right_style))
    row.append(Paragraph(pct_str(pct), cell_right_style))
    exp_table_data.append(row)

exp_total_row = [
    Paragraph('<b>TOTAL</b>', total_cell_style),
    Paragraph('<b>' + fmt(data["expenseGrandTotal"], data['baseCurrency']) + '</b>', total_cell_right_style),
]
for c in exp_currencies:
    exp_total_row.append(Paragraph('<b>' + fmt(data["expenseTotalsByCurrency"].get(c, 0), c) + '</b>', total_cell_right_style))
exp_total_row.append(Paragraph('<b>100%</b>', total_cell_right_style))
exp_table_data.append(exp_total_row)

exp_table = Table(exp_table_data, colWidths=exp_col_widths, hAlign='CENTER')
exp_style_cmds = [
    ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, -1), (-1, -1), TOTAL_ROW_BG),
    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, BG_SURFACE),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('LINEABOVE', (0, -1), (-1, -1), 2, ACCENT),
]
for i in range(1, len(exp_table_data) - 1):
    bg = colors.white if i % 2 == 1 else BG_PAGE
    exp_style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
exp_table.setStyle(TableStyle(exp_style_cmds))
story.append(exp_table)
story.append(Spacer(1, 18))

# REVENUE vs EXPENSE COMPARISON
story.append(Paragraph('<b>Revenue vs Expense Comparison</b>', section_style))

exp_pct_rev = (data["totalExpenses"] / data["totalRevenue"] * 100) if data["totalRevenue"] > 0 else 0

comp_data = [
    [
        Paragraph('<b>METRIC</b>', header_style),
        Paragraph('<b>AMOUNT (' + data['baseCurrency'] + ')</b>', header_style),
        Paragraph('<b>% OF REVENUE</b>', header_style),
    ],
    [
        Paragraph('Gross Revenue', cell_style),
        Paragraph(fmt(data["totalRevenue"], data['baseCurrency']), cell_right_style),
        Paragraph('100%', cell_right_style),
    ],
    [
        Paragraph('Total Expenses', cell_style),
        Paragraph(fmt(data["totalExpenses"], data['baseCurrency']), cell_right_style),
        Paragraph(pct_str(exp_pct_rev), cell_right_style),
    ],
    [
        Paragraph('<b>Net Profit</b>', cell_bold_style),
        Paragraph('<b>' + fmt(data["netProfit"], data['baseCurrency']) + '</b>', cell_bold_right_style),
        Paragraph('<b>' + pct_str(data["profitMargin"]) + '</b>', cell_bold_right_style),
    ],
]

comp_col_widths = [available_width * 0.40, available_width * 0.35, available_width * 0.25]
comp_table = Table(comp_data, colWidths=comp_col_widths, hAlign='CENTER')
comp_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), EMERALD_BG),
    ('BACKGROUND', (0, 2), (-1, 2), RED_BG),
    ('BACKGROUND', (0, 3), (-1, 3), profit_bg),
    ('GRID', (0, 0), (-1, -1), 0.5, BG_SURFACE),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('LINEABOVE', (0, 3), (-1, 3), 1.5, ACCENT),
]))
story.append(comp_table)
story.append(Spacer(1, 18))

# PER-TEU METRICS
if data.get("latestTeu") and data["latestTeu"]["loadedTEUs"] > 0:
    teu = data["latestTeu"]
    story.append(Paragraph('<b>Per-TEU Metrics</b>', section_style))

    profitPerTEU = data["netProfit"] / teu["loadedTEUs"]
    revenuePerTEU = data["totalRevenue"] / teu["loadedTEUs"]
    expensePerTEU = data["totalExpenses"] / teu["loadedTEUs"]

    teu_comp_data = [
        [
            Paragraph('<b>METRIC</b>', header_style),
            Paragraph('<b>PER TEU (' + data['baseCurrency'] + ')</b>', header_style),
        ],
        [
            Paragraph('Revenue per TEU', cell_style),
            Paragraph(fmt(revenuePerTEU, data['baseCurrency']), cell_right_style),
        ],
        [
            Paragraph('Expense per TEU', cell_style),
            Paragraph(fmt(expensePerTEU, data['baseCurrency']), cell_right_style),
        ],
        [
            Paragraph('<b>Profit per TEU</b>', cell_bold_style),
            Paragraph('<b>' + fmt(profitPerTEU, data['baseCurrency']) + '</b>', cell_bold_right_style),
        ],
    ]

    teu_comp_col_widths = [available_width * 0.55, available_width * 0.45]
    teu_comp_table = Table(teu_comp_data, colWidths=teu_comp_col_widths, hAlign='CENTER')
    teu_profit_bg = EMERALD_BG if profitPerTEU >= 0 else RED_BG
    teu_comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, 1), (-1, 1), EMERALD_BG),
        ('BACKGROUND', (0, 2), (-1, 2), RED_BG),
        ('BACKGROUND', (0, 3), (-1, 3), teu_profit_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, BG_SURFACE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(teu_comp_table)

# FOOTER
story.append(Spacer(1, 24))
story.append(HRFlowable(width="100%", thickness=0.5, color=BG_SURFACE, spaceAfter=6))
story.append(Paragraph('Generated by FreightFlow ERP', footer_style))

# Build PDF
doc.build(story)
`
}
