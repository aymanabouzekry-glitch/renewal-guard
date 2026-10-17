import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import bcrypt from "bcrypt"; // أو bcryptjs لو استخدمتها في إعداد المصادقة

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash("123456", 10);
    
    await db.insert(users).values({
      name: "Ayman Fathalla",
      email: "aymanfathalla97@gmail.com",
      passwordHash: passwordHash,
    });

    return NextResponse.json({ 
      message: "تم إنشاء الحساب بنجاح! ارجع لصفحة تسجيل الدخول واستخدم الباسورد: 123456" 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أو الحساب موجود بالفعل." }, { status: 500 });
  }
}