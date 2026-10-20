import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError?: (error: unknown) => void;
  fallback?: ReactNode;
}

/** Contains WebGL failures so they never take down the DOM content. */
export class StageErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
