import { NextRequest, NextResponse } from 'next/server';
import { deleteSender, getSenderById } from '../../../../lib/database';
import { requireSuperAdmin } from '@/lib/api-guard';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin(request);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  try {
    const senderId = params.id;
    
    if (!senderId) {
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      );
    }
    
    const sender = await getSenderById(senderId);
    
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }
    
    await deleteSender(senderId);
    
    return NextResponse.json(
      { success: true, message: 'Sender deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting sender:', error);
    return NextResponse.json(
      { error: 'Failed to delete sender' },
      { status: 500 }
    );
  }
}