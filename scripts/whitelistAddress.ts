import { NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';
import { Address, toNano } from '@ton/core';
import { collectionAddress } from './constants';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) return;

    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse(collectionAddress)));

    await nftCollection.sendWhitelistAddress(
        sender,
        toNano(0.035),
        Address.parse('0QBmHO2-sWbguZnE9JNGp-H8KOdcD0tL3NFLS6h3zJSjXqfA'),
    );
}
