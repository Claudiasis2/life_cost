import { Component } from 'react';

export default class GlobalErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled application error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <main role="alert"><h1>Ha ocurrido un error inesperado</h1><p>Recarga la página para volver a intentarlo.</p></main>;
    }
    return this.props.children;
  }
}
