import { NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';
import { collectionAddress } from './constants';
import { Address, toNano } from '@ton/core';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) return;
    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse(collectionAddress)));
    await nftCollection.sendStarted(sender, {
        startTimeInSec: 0,
        publicStartTimeInSec: 259200,
        endPublicMintTimeInSec: 518400,
    });
}
