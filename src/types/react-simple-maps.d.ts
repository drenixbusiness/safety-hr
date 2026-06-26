declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps {
    projection?: string | ((...args: unknown[]) => unknown);
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographiesProps<TGeography = unknown> {
    geography?: string | Record<string, unknown> | string[];
    children?: (props: { geographies: TGeography[]; outline: unknown; borders: unknown }) => React.ReactNode;
    parseGeographies?: (geographies: TGeography[]) => TGeography[];
  }

  export const Geographies: <TGeography = unknown>(
    props: GeographiesProps<TGeography>
  ) => React.ReactElement | null;

  export interface GeographyProps {
    geography?: unknown;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseUp?: (event: React.MouseEvent) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    className?: string;
  }

  export const Geography: React.FC<GeographyProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseUp?: (event: React.MouseEvent) => void;
    onFocus?: (event: React.FocusEvent) => void;
    onBlur?: (event: React.FocusEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    className?: string;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export const Marker: React.FC<MarkerProps>;

  export interface AnnotationProps {
    subject: [number, number];
    dx?: number;
    dy?: number;
    connectorProps?: Record<string, unknown>;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  export const Annotation: React.FC<AnnotationProps>;
}
