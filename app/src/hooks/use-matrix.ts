import { MatrixContext } from '@/components/providers/matrix-provider';
import { useContext } from 'react';

export function useMatrix() {
  const context = useContext(MatrixContext);
  if (context === undefined) {
    throw new Error('useMatrix must be used within a MatrixProvider');
  }
  return context;
}
