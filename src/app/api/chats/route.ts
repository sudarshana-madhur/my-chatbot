import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthUid } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await db.collection('users').doc(uid).collection('chats').orderBy('updatedAt', 'desc').get();
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'New Chat',
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || new Date().toISOString()
    }));
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty chat IDs provided' }, { status: 400 });
    }

    const batch = db.batch();

    for (const id of ids) {
      const chatRef = db.collection('users').doc(uid).collection('chats').doc(id);
      batch.delete(chatRef);
      
      // Attempt to delete messages subcollection
      const messagesSnapshot = await chatRef.collection('messages').get();
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error('Error deleting chats:', error);
    return NextResponse.json({ error: 'Failed to delete chats' }, { status: 500 });
  }
}
