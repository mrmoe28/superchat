import * as React from 'react';

declare global {
  namespace JSX {
    interface Element {
      type: string | React.JSXElementConstructor<unknown>;
      props: Record<string, unknown>;
      key: string | number | null;
    }
    interface ElementClass {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { 
      props: Record<string, unknown>; 
    }
    interface ElementChildrenAttribute { 
      children: Record<string, unknown>; 
    }
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }

  type ReactNode = React.ReactNode;
  type ReactElement = React.ReactElement;
  type JSXElementConstructor<P> = React.JSXElementConstructor<P>;
  type PromiseLikeOfReactNode = PromiseLike<React.ReactNode>;
  type Key = React.Key;
  type ChangeEvent<T> = React.ChangeEvent<T>;
  type FormEvent<T> = React.FormEvent<T>;

  interface Window {
    hljs: unknown;
    toggleConsole: () => void;
  }
}

declare module 'react' {
  export interface ReactElement<P = unknown, T extends string | JSXElementConstructor<unknown> = string | JSXElementConstructor<unknown>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type JSXElementConstructor<P> = ((props: P) => ReactElement<unknown, unknown> | null) | (new (props: P) => Component<unknown, unknown>);
  export type Key = string | number;
  export type ReactNode = string | number | ReactElement | Array<ReactNode> | null | undefined;
  export type PromiseLikeOfReactNode = PromiseLike<ReactNode>;

  export interface ChangeEvent<T = Element> {
    target: T;
    currentTarget: T;
  }

  export interface FormEvent<T = Element> {
    target: T;
    currentTarget: T;
    preventDefault(): void;
  }

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useRef<T>(initialValue: T): { current: T };
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
}

export {}; 