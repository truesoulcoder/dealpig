import { NextRequest, NextResponse } from 'next/server';
import { deleteSender } from '@/lib/database';
import { getServerSession } from 'next-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const senderId = params.id;
    
    if (!senderId) {
      return NextResponse.json(
        { success: false, message: 'Sender ID is required' },
        { status: 400 }
      );
    }

    // Delete the sender from the database
    const success = await deleteSender(senderId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete sender' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Sender deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sender:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}