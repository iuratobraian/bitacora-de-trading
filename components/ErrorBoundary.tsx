import React from 'react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-loss mb-4">Algo salió mal</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página para continuar.
            </p>
            <div className="bg-black/50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-gray-500">
              {this.state.error?.message || 'Error desconocido'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-black font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors w-full"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
