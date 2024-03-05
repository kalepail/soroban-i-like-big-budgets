import { Account, Keypair, Networks, Operation, SorobanRpc, TransactionBuilder, nativeToScVal } from "@stellar/stellar-sdk";
import { sorobill } from "sorobill";

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

const MAX_U32 = (2 ** 32) - 1

const args = [
    nativeToScVal(1500, { type: 'u32' }),
    nativeToScVal(200, { type: 'u32' }),
    nativeToScVal(20, { type: 'u32' }),
    nativeToScVal(40, { type: 'u32' }),
    nativeToScVal(1, { type: 'u32' }),
    nativeToScVal(Buffer.alloc(71_680)),
]

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
    simRes.minResourceFee = MAX_U32.toString()

    const resources = simRes.transactionData.build().resources()
    const tx = SorobanRpc.assembleTransaction(simTx, simRes)
        .setSorobanData(simRes.transactionData
            .setResourceFee(100_000_000)
            .setResources(MAX_U32, resources.readBytes(), resources.writeBytes())
            .build()
        )
        .build()

    tx.sign(keypair)

    const sendRes = await rpc.sendTransaction(tx)

    if (sendRes.status === 'PENDING') {
        await Bun.sleep(5000);
        const getRes = await rpc.getTransaction(sendRes.hash)

        if (getRes.status === 'SUCCESS') {
            console.log(await sorobill(simRes, getRes));
        } else console.log(await rpc._getTransaction(sendRes.hash));
    } else console.log(await rpc._sendTransaction(tx))
} else console.log(await rpc._simulateTransaction(simTx));