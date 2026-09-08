/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module 'next/link' {
  import React from 'react';
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    children?: React.ReactNode;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module 'next/navigation' {
  export interface ReadonlyURLSearchParams extends URLSearchParams {}
  export function useRouter(): {
    push(url: string): void;
    replace(url: string): void;
    refresh(): void;
    back(): void;
    forward(): void;
    prefetch(url: string): void;
  };
  export function usePathname(): string;
  export function useParams<T extends Record<string, string | string[]> = Record<string, string | string[]>>(): T;
  export function useSearchParams(): ReadonlyURLSearchParams;
  export function redirect(url: string, type?: any): never;
}

declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
}
