import { NetworkProvider } from '@ton/blueprint';
import { collectionAddress } from './constants';
import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { WhitelistWallet } from '../wrappers/WhitelistWallet';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) return;
    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse(collectionAddress)));

    const { nextItemIndex } = await nftCollection.getCollectionData();

    const whitelistCheckerAddress = await nftCollection.getWhitelistAddress(address);

    const whitelistChecker = provider.open(WhitelistWallet.createFromAddress(whitelistCheckerAddress));

    await whitelistChecker.sendMint(sender, toNano(0), {
        queryId: null,
        itemIndex: nextItemIndex,
        itemOwnerAddress: address,
        commonContentUrl: `${nextItemIndex}.json`,
    });
}
