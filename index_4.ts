import { nativeToScVal } from "@stellar/stellar-sdk";
import { invokeRunWithArgs } from "./utils/invoke_run_with_args";

const args = [
    nativeToScVal(1500, { type: 'u32' }),
    nativeToScVal(200, { type: 'u32' }),
    nativeToScVal(20, { type: 'u32' }),
    nativeToScVal(40, { type: 'u32' }),
    nativeToScVal(1, { type: 'u32' }),
    nativeToScVal(Buffer.alloc(71_680)),
]

await invokeRunWithArgs(args)