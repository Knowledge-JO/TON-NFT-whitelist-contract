import { NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';
import { collectionAddress } from './constants';
import { Address, toNano } from '@ton/core';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) return;
    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse(collectionAddress)));
    const { nextItemIndex } = await nftCollection.getCollectionData();
    await nftCollection.sendMint(sender, toNano('0.165'), {
        queryId: nextItemIndex,
        itemOwnerAddress: address,
        itemIndex: nextItemIndex,
        commonContentUrl: `${nextItemIndex}.json`,
    });
}
