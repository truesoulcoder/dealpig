import { NextRequest, NextResponse } from 'next/server';
import { getLeads, insertLead, updateLead, deleteLead } from '@/lib/database';

// GET /api/leads - Retrieve all leads
export async function GET(request: NextRequest) {
  try {
    const leads = await getLeads();
    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();
    
    // Basic validation - you can implement more detailed validation as needed
    if (!leadData.property_address) {
      return NextResponse.json({ error: 'Property address is required' }, { status: 400 });
    }
    
    const newLead = await insertLead(leadData);
    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

// PUT /api/leads/:id - Update an existing lead
export async function PUT(request: NextRequest) {
  try {
    const leadData = await request.json();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    
    const updatedLead = await updateLead(id, leadData);
    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// DELETE /api/leads/:id - Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    
    await deleteLead(id);
    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}