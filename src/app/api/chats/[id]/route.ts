import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthUid } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const snapshot = await db.collection('users').doc(uid).collection('chats').doc(id).collection('messages').orderBy('createdAt', 'asc').get();
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sender: data.role === 'model' ? 'model' : 'user',
        text: data.text,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString()
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
