// دالة لحساب الأيام المتبقية بدقة
export function calculateDaysRemaining(dueDate: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  const expiration = new Date(dueDate);
  expiration.setHours(0, 0, 0, 0);
  
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// دالة لحساب مؤشر الجاهزية (Readiness Score) من 0 لـ 100
export function calculateReadinessScore(document: { status: string, dueDate: string }): number {
  let score = 0;
  const days = calculateDaysRemaining(document.dueDate);

  // 1. عامل الوقت (أقصى درجة 60)
  if (days > 60) score += 60;
  else if (days > 30) score += 40;
  else if (days > 14) score += 20;
  else if (days > 0) score += 10;
  else score += 0; // منتهي الصلاحية

  // 2. عامل حالة المستند (أقصى درجة 40)
  if (document.status === 'Active') score += 40;
  else if (document.status === 'Pending') score += 20;
  
  return score;
}

// دالة لتحديد اللون المناسب للتقييم
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (score >= 50) return "text-amber-700 bg-amber-100 border-amber-200";
  return "text-red-700 bg-red-100 border-red-200";
}