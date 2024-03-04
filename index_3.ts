import { nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { invokeRunWithArgs } from "./utils/invoke_run_with_args";

let i = 0
let args = [
    [1500, 'u32', 'CPU'],
    [200, 'u32', 'MEM'],
    [20, 'u32', 'SET'], // NOTE if this is 50 you get a different error. Because why not?!
    [40, 'u32', 'GET'],
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

        await invokeRunWithArgs(bigArgs)
    } catch (error) {
        console.error(error)
    } finally {
        i++
        console.log(`--------------------------`);
    }
}