import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let profile = await db.companyProfile.findFirst()

    if (!profile) {
      // Create default profile if none exists
      profile = await db.companyProfile.create({
        data: {
          name: 'FreightFlow Logistics',
          baseCurrency: 'USD',
        },
      })
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    let profile = await db.companyProfile.findFirst()

    if (!profile) {
      // Create if doesn't exist
      profile = await db.companyProfile.create({
        data: {
          name: body.name || 'FreightFlow Logistics',
          legalName: body.legalName || null,
          taxId: body.taxId || null,
          address: body.address || null,
          city: body.city || null,
          country: body.country || null,
          phone: body.phone || null,
          email: body.email || null,
          website: body.website || null,
          logo: body.logo || null,
          baseCurrency: body.baseCurrency || 'USD',
        },
      })
    } else {
      profile = await db.companyProfile.update({
        where: { id: profile.id },
        data: {
          name: body.name,
          legalName: body.legalName ?? null,
          taxId: body.taxId ?? null,
          address: body.address ?? null,
          city: body.city ?? null,
          country: body.country ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          website: body.website ?? null,
          logo: body.logo ?? null,
          baseCurrency: body.baseCurrency,
        },
      })
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
