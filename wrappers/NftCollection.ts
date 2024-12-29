import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    royaltyPercent: number;
    royaltyAddress: Address;
    collectionContentUrl: string;
    commonContentUrl: string;
    nftItemCode: Cell;
    started: number;
    startTime: number;
    publicStartTime: number;
    endPublicMintTime: number;
    whitelistCheckerCode: Cell;
};

export type mintParams = {
    queryId: number | null;
    itemOwnerAddress: Address;
    itemIndex: number;
    commonContentUrl: string;
};

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    const configCell = beginCell();

    configCell.storeAddress(config.ownerAddress);
    configCell.storeUint(config.nextItemIndex, 64);

    const contentCell = beginCell();

    const collectionContent = encodeOffChainContent(config.collectionContentUrl);

    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(config.commonContentUrl));

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());

    configCell.storeRef(contentCell);

    configCell.storeRef(config.nftItemCode);

    const royaltyBase = 1000;
    const royaltyFactor = Math.floor(config.royaltyPercent * royaltyBase);
    const royaltyCell = beginCell();
    royaltyCell.storeUint(royaltyFactor, 16);
    royaltyCell.storeUint(royaltyBase, 16);
    royaltyCell.storeAddress(config.royaltyAddress);

    configCell.storeRef(royaltyCell);
    configCell.storeInt(config.started, 4);
    configCell.storeUint(config.startTime, 64);
    configCell.storeUint(config.publicStartTime, 64);
    configCell.storeUint(config.endPublicMintTime, 64);
    configCell.storeRef(config.whitelistCheckerCode);
    return configCell.endCell();
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
    const chunks: Buffer[] = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.subarray(0, chunkSize));
        buff = buff.subarray(chunkSize);
    }
    return chunks;
}
function makeSnakeCell(data: Buffer): Cell {
    const chunks = bufferToChunks(data, 127);

    if (chunks.length === 0) {
        return beginCell().endCell();
    }

    if (chunks.length === 1) {
        return beginCell().storeBuffer(chunks[0]).endCell();
    }

    let curCell = beginCell();

    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];

        curCell.storeBuffer(chunk);

        if (i - 1 >= 0) {
            const nextCell = beginCell();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }

    return curCell.endCell();
}
export function encodeOffChainContent(content: string) {
    let data = Buffer.from(content);
    const offChainPrefix = Buffer.from([0x01]);
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}

export class NftCollection implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendStarted(
        provider: ContractProvider,
        via: Sender,
        options: {
            startTimeInSec: number;
            publicStartTimeInSec: number;
            endPublicMintTimeInSec: number;
        },
    ) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(4, 32)
                .storeUint(0, 64)
                .storeInt(-1, 4)
                .storeUint(options.startTimeInSec, 64)
                .storeUint(options.publicStartTimeInSec, 64)
                .storeUint(options.endPublicMintTimeInSec, 64)
                .endCell(),
        });
    }

    createMintBody(params: mintParams): Cell {
        const body = beginCell();
        body.storeUint(1, 32);
        body.storeUint(params.queryId || 0, 64);
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

    async sendChangeAdmin(provider: ContractProvider, via: Sender, newAdmin: Address) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(3, 32).storeUint(0, 64).storeAddress(newAdmin).endCell(),
        });
    }

    async sendWithdraw(provider: ContractProvider, via: Sender, amount: bigint, toAddr: Address) {
        await provider.internal(via, {
            value: toNano('0.01'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(5, 32).storeUint(0, 64).storeCoins(amount).storeAddress(toAddr).endCell(),
        });
    }

    async sendWhitelistAddress(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(7, 32).storeUint(0, 64).storeAddress(address).endCell(),
        });
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number) {
        const res = await provider.get('get_nft_address_by_index', [{ type: 'int', value: BigInt(index) }]);
        return res.stack.readAddress();
    }

    async getTimeStatusData(provider: ContractProvider) {
        const res = await provider.get('get_contract_time_status', []);

        return {
            started: res.stack.readNumber(),
            startTime: res.stack.readNumber(),
            publicStartTime: res.stack.readNumber(),
            endPublicMintTime: res.stack.readNumber(),
            timeNow: res.stack.readNumber(),
        };
    }

    async getCollectionData(provider: ContractProvider) {
        const res = await provider.get('get_collection_data', []);

        return {
            nextItemIndex: res.stack.readNumber(),
        };
    }

    async getWhitelistAddress(provider: ContractProvider, owner: Address) {
        const res = await provider.get('get_whitelist_checker_address', [
            { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
        ]);

        return res.stack.readAddress();
    }
}
