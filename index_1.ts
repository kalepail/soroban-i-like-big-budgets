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

let i = 0
let args = [
    [1500, 'u32', 'CPU'],
    [200, 'u32', 'MEM'],
    [50, 'u32', 'SET'], // NOTE if this is 50 you get a different error. Because why not?!
    [50, 'u32', 'GET'],
    [1, 'u32', 'EVENTS'],
    [Buffer.alloc(71_680), 'bytes', 'TXN'],
]

for (const [big, type, kind] of args) {
    try {
        console.log(`\n`);
        console.log(`RUNNING TEST FOR ${kind}`);
        console.log(`--------------------------`);

        const args = [
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
        ]
        const bigArgs = [...args]

        bigArgs[i] = nativeToScVal(big, { type })

        await run(bigArgs)
    } catch (error) {
        console.error(error)
    } finally {
        i++
        console.log(`--------------------------`);
    }
}

async function run(args: xdr.ScVal[]) {
    const source = await rpc
        .getAccount(pubkey)
        .then((account) => new Account(account.accountId(), account.sequenceNumber()))
        .catch(() => { throw new Error(`Issue with ${pubkey} account. Ensure you're running the \`./docker.sh\` network and have run \`bun run deploy.ts\` recently.`) })

    const simTx = new TransactionBuilder(source, {
        fee: '0',
        networkPassphrase
    })
        .addOperation(Operation.invokeContractFunction({
            contract: contractId,
            function: 'run',
            args
        }))
        .setTimeout(0)
        .build()

    const simRes = await rpc.simulateTransaction(simTx)

    if (SorobanRpc.Api.isSimulationSuccess(simRes)) {
        simRes.minResourceFee = '4294967295'

        const resources = simRes.transactionData.build().resources()
        const tx = SorobanRpc.assembleTransaction(simTx, simRes)
            .setSorobanData(simRes.transactionData
                .setResourceFee(100_000_000)
                .setResources(100_000_000, resources.readBytes(), resources.writeBytes())
                .build()
            )
            .build()

        tx.sign(keypair)

        const sendRes = await rpc._sendTransaction(tx)

        if (sendRes.status === 'PENDING') {
            await Bun.sleep(5000);
            const getRes = await rpc._getTransaction(sendRes.hash)

            if (getRes.resultMetaXdr) {
                xdr.TransactionMeta
                    .fromXDR(getRes.resultMetaXdr, 'base64')
                    .v3()
                    .sorobanMeta()
                    ?.diagnosticEvents()
                    .forEach((event) => {
                        console.log(
                            scValToNative(event.event().body().v0().data())
                        )
                    })
            } else console.log(getRes)
        } else console.log(sendRes)
    } else console.log(await rpc._simulateTransaction(simTx));
}