import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 1. التأكد من إدخال البيانات
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 2. فحص إذا كان الإيميل مسجل مسبقاً
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // 3. تشفير الباسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. إنشاء الحساب في الداتا بيز
    const newUser = await db.insert(users).values({
      name: name || 'New User',
      email: email,
      passwordHash: hashedPassword,
    }).returning();

    return NextResponse.json({ message: 'User registered successfully!', user: newUser[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}