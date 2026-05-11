'use server';

import { db } from '@/server/db';
import { registrations } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleAttended(id: number, currentStatus: boolean) {
  await db.update(registrations)
    .set({ attended: !currentStatus })
    .where(eq(registrations.id, id));
  
  revalidatePath('/');
}

export async function updateNotes(id: number, notes: string) {
  await db.update(registrations)
    .set({ adminNotes: notes })
    .where(eq(registrations.id, id));
  
  revalidatePath('/');
}
