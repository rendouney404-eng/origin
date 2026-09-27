import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="reading-shell flex min-h-[100dvh] w-full items-center justify-center p-6" dir="rtl">
      <Card className="w-full max-w-md border-border/70 bg-card/80 shadow-[var(--shadow-soft)]">
        <CardContent className="px-7 py-8">
          <div className="mb-5 flex items-center gap-3">
            <AlertCircle className="size-8 text-primary" />
            <h1 className="font-[var(--app-font-serif)] text-3xl font-semibold text-foreground">
              الصفحة غير موجودة
            </h1>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            يبدو أن هذه الصفحة ليست جزءًا من مساحة ورد. يمكنك العودة إلى القراءة من الصفحة الرئيسية.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
