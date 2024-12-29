import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'func',
    targets: ['contracts/whitelist_wallet.fc'],
};
