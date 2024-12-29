import { NetworkProvider } from '@ton/blueprint';
import { NftCollection } from '../wrappers/NftCollection';
import { collectionAddress } from './constants';
import { Address } from '@ton/core';
import { WhitelistWallet } from '../wrappers/WhitelistWallet';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) return;
    const nftCollection = provider.open(NftCollection.createFromAddress(Address.parse(collectionAddress)));

    const { started, startTime, publicStartTime, endPublicMintTime } = await nftCollection.getTimeStatusData();
    console.log({ started, startTime, publicStartTime, endPublicMintTime });

    const { nextItemIndex } = await nftCollection.getCollectionData();
    console.log({ nextItemIndex });

    // whitelist checker

    const whitelistCheckerAddress = await nftCollection.getWhitelistAddress(address);

    console.log({ whitelistCheckerAddress });

    const whitelistChecker = provider.open(WhitelistWallet.createFromAddress(whitelistCheckerAddress));

    const whitelistData = await whitelistChecker.getWhitelistData();

    console.log({ whitelistData });
}
