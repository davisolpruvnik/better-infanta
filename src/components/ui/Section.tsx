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
    <section className={cn('py-8 bg-white', className)} id={id}>
      <div className={cn('container mx-auto px-4', className)}>{children}</div>
    </section>
  );
}
