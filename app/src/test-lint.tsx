import { useState } from 'react';

interface TestComponentProps {
  label?: string;
}

const TestComponent = ({ label }: TestComponentProps): JSX.Element => {
  const [state, setState] = useState('');

  return <div>{state || label}</div>;
};

export default TestComponent;
