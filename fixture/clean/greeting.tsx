import { createContext, useContext } from 'react';

const NameContext = createContext<string | undefined>(undefined);

export const Greeting = () => {
  const name = useContext(NameContext);
  return <p role="status">{name ? `Hello, ${name}` : 'Hello'}</p>;
};

export const NamedGreeting = ({ name }: { name?: string }) => (
  <NameContext value={name}>
    <Greeting />
  </NameContext>
);
