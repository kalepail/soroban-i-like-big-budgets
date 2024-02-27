import { ContractSpec } from '@stellar/stellar-sdk';
import { Buffer } from "buffer";
import { AssembledTransaction } from './assembled-tx.js';
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
};
/**
    
    */
export const Errors = {};
export class Contract {
    options;
    spec;
    constructor(options) {
        this.options = options;
        this.spec = new ContractSpec([
            "AAAAAAAAAAAAAAADcnVuAAAAAAEAAAAAAAAABWNvdW50AAAAAAAABAAAAAEAAAPsAAAD7gAAACAAAAAE"
        ]);
    }
    parsers = {
        run: (result) => this.spec.funcResToNative("run", result)
    };
    txFromJSON = (json) => {
        const { method, ...tx } = JSON.parse(json);
        return AssembledTransaction.fromJSON({
            ...this.options,
            method,
            parseResultXdr: this.parsers[method],
        }, tx);
    };
    fromJSON = {
        run: (this.txFromJSON)
    };
    /**
* Construct and simulate a run transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
*/
    run = async ({ count }, options = {}) => {
        return await AssembledTransaction.fromSimulation({
            method: 'run',
            args: this.spec.funcArgsToScVals("run", { count }),
            ...options,
            ...this.options,
            errorTypes: Errors,
            parseResultXdr: this.parsers['run'],
        });
    };
}
