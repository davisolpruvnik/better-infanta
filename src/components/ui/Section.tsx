import { cn } from '../../lib/utils';
export default function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn('bg-fantas-50/40 py-8', className)} id={id}>
      <div className={cn('container mx-auto px-8 sm:px-12', className)}>{children}</div>
    </section>
  );
}
