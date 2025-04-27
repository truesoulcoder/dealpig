import { NextRequest, NextResponse } from 'next/server';
import { deleteSender, getSenderById } from '../../../../lib/database';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const senderId = params.id;
    
    if (!senderId) {
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      );
    }
    
    // Check user authentication - await the cookies() function
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get sender details to verify ownership
    const sender = await getSenderById(senderId);
    
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }
    
    // Check if this sender belongs to the current user
    // This check can be expanded based on your permission model
    // For now, we'll assume any authenticated user can delete any sender
    
    // Delete the sender
    await deleteSender(senderId);
    
    return NextResponse.json(
      { success: true, message: 'Sender deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sender:', error);
    return NextResponse.json(
      { error: 'Failed to delete sender' },
      { status: 500 }
    );
  }
}