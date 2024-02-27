"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = exports.Errors = exports.networks = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const buffer_1 = require("buffer");
const assembled_tx_js_1 = require("./assembled-tx.js");
__exportStar(require("./assembled-tx.js"), exports);
__exportStar(require("./method-options.js"), exports);
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || buffer_1.Buffer;
}
exports.networks = {
    futurenet: {
        networkPassphrase: "Test SDF Future Network ; October 2022",
        contractId: "CAE7FN6RRYXCU3KBMORMJZIIFHSM32KMRSH5RC6ENIUGAZISCTME3MWH",
    }
};
/**
    
    */
exports.Errors = {};
class Contract {
    options;
    spec;
    constructor(options) {
        this.options = options;
        this.spec = new stellar_sdk_1.ContractSpec([
            "AAAAAAAAAAAAAAADcnVuAAAAAAEAAAAAAAAABWNvdW50AAAAAAAABAAAAAEAAAPsAAAD7gAAACAAAAAE"
        ]);
    }
    parsers = {
        run: (result) => this.spec.funcResToNative("run", result)
    };
    txFromJSON = (json) => {
        const { method, ...tx } = JSON.parse(json);
        return assembled_tx_js_1.AssembledTransaction.fromJSON({
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
        return await assembled_tx_js_1.AssembledTransaction.fromSimulation({
            method: 'run',
            args: this.spec.funcArgsToScVals("run", { count }),
            ...options,
            ...this.options,
            errorTypes: exports.Errors,
            parseResultXdr: this.parsers['run'],
        });
    };
}
exports.Contract = Contract;
