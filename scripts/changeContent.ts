import { NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';
import { collectionAddress } from './constants';
import { Address, toNano } from '@ton/core';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;

    if (!address) return;

    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse(collectionAddress)));

    await nftCollection.sendChangeContent(sender, toNano('0.02'), {
        collectionContent: 'ipfs://bafybeicgzblwbljoba6h5p3fxwtxkiaeh3nb2uwhmuio7rohwcqbxojz4i/collection.json',
        commonContent: 'ipfs://bafybeicgzblwbljoba6h5p3fxwtxkiaeh3nb2uwhmuio7rohwcqbxojz4i/',
    });
}
