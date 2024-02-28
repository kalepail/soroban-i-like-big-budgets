import { Account, Keypair, Networks, Operation, SorobanDataBuilder, SorobanRpc, TransactionBuilder, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

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

const source = await rpc
    .getAccount(pubkey)
    .then((account) => new Account(account.accountId(), account.sequenceNumber()))
    .catch(() => { throw new Error(`Issue with ${pubkey} account. Ensure you're running the \`./docker.sh\` network and have run \`bun run deploy.ts\` recently.`) })

const simTx = new TransactionBuilder(source, {
    fee: (2 ** 32 - 1).toString(),
    networkPassphrase
})
    .addOperation(Operation.invokeContractFunction({
        contract: contractId, // networks.futurenet.contractId,
        function: 'run',
        args: [
            // nativeToScVal(1, { type: 'u32' }),
            xdr.ScVal.scvVoid(),
            // nativeToScVal(1, { type: 'u32' }),
            xdr.ScVal.scvVoid(),
            // nativeToScVal(21, { type: 'u32' }),
            xdr.ScVal.scvVoid(),
            nativeToScVal(1, { type: 'u32' }),
        ]
    }))
    .setTimeout(0)
    .build()

const simRes = await rpc._simulateTransaction(simTx)

console.log(simRes);

if (!simRes.transactionData) 
    throw new Error('No transaction data. Review simulation response for errors. Maybe try running `bun run deploy.ts` again.')

const sorobanData = new SorobanDataBuilder(simRes.transactionData)
    .setResourceFee((2 ** 32 - 1) - 1_000_000)
    .setResources(100_000_000, 133_120, 66_560)
    .build();

const tx = TransactionBuilder.cloneFrom(simTx)
    .clearOperations()
    .addOperation(Operation.invokeContractFunction({
        contract: contractId, // networks.futurenet.contractId,
        function: 'run',
        args: [
            // nativeToScVal(12_000, { type: 'u32' }),
            xdr.ScVal.scvVoid(),
            // nativeToScVal(10_000, { type: 'u32' }),
            xdr.ScVal.scvVoid(),
            // nativeToScVal(21, { type: 'u32' }),
            xdr.ScVal.scvVoid(),
            nativeToScVal(10, { type: 'u32' }),
        ]
    }))
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