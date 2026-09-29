import { Card } from '@/components/ui/Card';

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">{value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
