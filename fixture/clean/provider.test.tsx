import { createContext } from 'react';

const Ctx = createContext({ open: false });

export const renderOpen = () => <Ctx value={{ open: true }}>{null}</Ctx>;
