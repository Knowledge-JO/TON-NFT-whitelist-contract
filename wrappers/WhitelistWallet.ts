import { Address, beginCell, Cell, Contract, ContractProvider, Sender, SendMode } from '@ton/core';
import { mintParams } from './NftCollection';

export class WhitelistWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new WhitelistWallet(address);
    }

    createMintBody(params: mintParams): Cell {
        const body = beginCell();
        body.storeUint(11, 32);
        body.storeUint(params.itemIndex, 64);
        const nftItemContent = beginCell();
        nftItemContent.storeAddress(params.itemOwnerAddress);
        const uriContent = beginCell();
        uriContent.storeBuffer(Buffer.from(params.commonContentUrl));
        nftItemContent.storeRef(uriContent.endCell());
        body.storeRef(nftItemContent.endCell());
        return body.endCell();
    }

    async sendMint(provider: ContractProvider, via: Sender, value: bigint, params: mintParams) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: this.createMintBody(params),
        });
    }

    async getWhitelistData(provider: ContractProvider) {
        const res = await provider.get('get_whitelist_data', []);

        return {
            whitelistAddress: res.stack.readAddress(),
            whitelisted: res.stack.readNumber(),
            nftCollectionAddress: res.stack.readAddress(),
        };
    }
}
