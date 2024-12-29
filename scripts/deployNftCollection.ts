import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const address = sender.address;
    if (!address) return;
    const nftCollection = provider.open(
        NftCollection.createFromConfig(
            {
                ownerAddress: address,
                nextItemIndex: 0,
                royaltyPercent: 0.05,
                royaltyAddress: Address.parse('0QAUGgVrmYWc0sPMsolAT6Z4jjaZ574lEgYj9vCk-X74iqlU'),
                collectionContentUrl:
                    'ipfs://bafybeifrtfi3ejkm6npzdyco7zsicsdxal7jyfgwd33d3arqosp2pzfg3u/collection.json',
                commonContentUrl: 'ipfs://bafybeifrtfi3ejkm6npzdyco7zsicsdxal7jyfgwd33d3arqosp2pzfg3u/',
                nftItemCode: await compile('NftItem'),
                started: 0,
                startTime: 0,
                publicStartTime: 0,
                endPublicMintTime: 0,
                whitelistCheckerCode: await compile('WhitelistWallet'),
            },
            await compile('NftCollection'),
        ),
    );

    await nftCollection.sendDeploy(provider.sender(), toNano('0.03'));

    await provider.waitForDeploy(nftCollection.address);

    // run methods on `nftCollection`
}
