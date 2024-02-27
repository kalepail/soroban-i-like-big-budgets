import { ContractSpec, Address } from '@stellar/stellar-sdk';
import { Buffer } from "buffer";
import { AssembledTransaction, Ok, Err } from './assembled-tx.js';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
  Error_,
  Result,
} from './assembled-tx.js';
import type { ClassOptions, XDR_BASE64 } from './method-options.js';

export * from './assembled-tx.js';
export * from './method-options.js';

if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}


export const networks = {
    futurenet: {
        networkPassphrase: "Test SDF Future Network ; October 2022",
        contractId: "CAE7FN6RRYXCU3KBMORMJZIIFHSM32KMRSH5RC6ENIUGAZISCTME3MWH",
    }
} as const

/**
    
    */
export const Errors = {

}

export class Contract {
    spec: ContractSpec;
    constructor(public readonly options: ClassOptions) {
        this.spec = new ContractSpec([
            "AAAAAAAAAAAAAAADcnVuAAAAAAEAAAAAAAAABWNvdW50AAAAAAAABAAAAAEAAAPsAAAD7gAAACAAAAAE"
        ]);
    }
    private readonly parsers = {
        run: (result: XDR_BASE64): Map<Buffer, u32> => this.spec.funcResToNative("run", result)
    };
    private txFromJSON = <T>(json: string): AssembledTransaction<T> => {
        const { method, ...tx } = JSON.parse(json)
        return AssembledTransaction.fromJSON(
            {
                ...this.options,
                method,
                parseResultXdr: this.parsers[method],
            },
            tx,
        );
    }
    public readonly fromJSON = {
        run: this.txFromJSON<ReturnType<typeof this.parsers['run']>>
    }
        /**
    * Construct and simulate a run transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
    */
    run = async ({count}: {count: u32}, options: {
        /**
         * The fee to pay for the transaction. Default: 100.
         */
        fee?: number,
    } = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'run',
            args: this.spec.funcArgsToScVals("run", {count}),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['run'],
        });
    }

}