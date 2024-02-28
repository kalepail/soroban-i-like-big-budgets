import { Keypair, Networks, SorobanDataBuilder, SorobanRpc, Transaction, TransactionBuilder, hash, scValToNative, xdr } from "@stellar/stellar-sdk";
import { Contract, networks } from 'i-like-big-budgets-sdk'

if (
    !Bun.env.CONTRACT_ID
    || !Bun.env.SECRET
) throw new Error('Missing .env.local file. Run `bun run deploy.ts` to create it.')

const rpcUrl = 'http://localhost:8000/soroban/rpc'
const rpc = new SorobanRpc.Server(rpcUrl, { allowHttp: true })

const keypair = Keypair.fromSecret(Bun.env.SECRET)
const pubkey = keypair.publicKey()

const contractId = Bun.env.CONTRACT_ID
const networkPassphrase = Networks.STANDALONE

class Wallet {
    isConnected = async () => true
    isAllowed = async () => true
    getUserInfo = async () => ({ publicKey: pubkey })
    signTransaction = async (tx: string) => {
        const t = TransactionBuilder.fromXDR(tx, networkPassphrase);
        t.sign(keypair);
        return t.toXDR();
    }
    signAuthEntry = async (entryXdr: string) => {
        return keypair
            .sign(hash(Buffer.from(entryXdr, 'base64')))
            .toString('base64')
    }
}

const contract = new Contract({
    ...networks.standalone,
    contractId,
    rpcUrl,
    wallet: new Wallet()
})

const simResSmall = await contract.run({
    gimme_cpu: 1,
    gimme_mem: undefined,
    gimme_storage: undefined,
    gimme_events: undefined
})

const sorobanData = new SorobanDataBuilder(simResSmall.simulationData.transactionData)
    .setResourceFee((2 ** 32 - 1) - 1_000_000)
    .setResources(100_000_000, 133_120, 66_560)
    .build();

const simResBig = await contract.run({
    gimme_cpu: 12_000,
    gimme_mem: undefined,
    gimme_storage: undefined,
    gimme_events: undefined
}, {
    fee: 2 ** 32 - 1,
})

const tx = TransactionBuilder
    .cloneFrom(new Transaction(simResBig.raw.toXDR(), networkPassphrase))
    .setSorobanData(sorobanData)
    .build()

tx.sign(keypair)

console.log(tx.toXDR());

const sendRes = await rpc._sendTransaction(tx)

console.log(sendRes);

sendRes.status === 'PENDING' && setTimeout(async () => {
    const getRes = await rpc._getTransaction(sendRes.hash)

    getRes.status !== 'FAILED' && console.log(getRes)

    getRes.status === 'FAILED' && xdr.TransactionMeta
        .fromXDR(getRes.resultMetaXdr!, 'base64')
        .v3()
        .sorobanMeta()
        ?.diagnosticEvents()
        .forEach((event) => {
            console.log(
                scValToNative(event.event().body().v0().data())
            )
        })
}, 5000)