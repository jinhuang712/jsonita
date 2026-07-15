import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export type ActionButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ActionButtonVariant }
>;

export function ActionButton({ variant = 'secondary', className, children, ...props }: Props) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={`jsonita-action-button jsonita-action-button-${variant}${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
