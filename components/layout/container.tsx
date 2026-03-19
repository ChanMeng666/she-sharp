import { cn } from "@/lib/utils";
import { layoutSystem, getContainer } from "@/lib/design-system";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: keyof typeof layoutSystem.containers;
}

export function Container({
  children,
  className,
  size = "content",
}: ContainerProps) {
  return (
    <div className={cn(getContainer(size), className)}>
      {children}
    </div>
  );
}