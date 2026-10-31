import { createContext } from 'react';

const Ctx = createContext({ open: false });

export const Provider = ({ open }: { open: boolean }) => <Ctx value={{ open }}>{null}</Ctx>;
