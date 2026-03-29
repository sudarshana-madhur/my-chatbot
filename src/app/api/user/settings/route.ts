import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthUid } from '@/lib/auth';

export async function GET() {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docRef = db.collection('users').doc(uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return NextResponse.json({ selectedModel: docSnap.data()?.selectedModel });
    } else {
      // Return default model
      return NextResponse.json({ selectedModel: 'gemini-2.5-flash' });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const uid = await getAuthUid();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { selectedModel } = await req.json();
    
    if (!selectedModel) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    const docRef = db.collection('users').doc(uid);
    await docRef.set({ selectedModel }, { merge: true });
    
    return NextResponse.json({ success: true, selectedModel });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
