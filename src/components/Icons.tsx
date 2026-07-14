import * as Icons from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
}

export default function Icon({ name, ...props }: IconProps) {
  // Fallback if icon doesn't exist
  const LucideIcon = (Icons as any)[name] || Icons.HelpCircle;
  return <LucideIcon {...props} />;
}
