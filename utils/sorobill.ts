import { Soroban, SorobanRpc, Transaction } from '@stellar/stellar-sdk'

export function sorobill(simTx: Transaction, sim: SorobanRpc.Api.SimulateTransactionSuccessResponse) {
    const events = sim.events.map((event) => {
        if (event.event().type().name === 'diagnostic')
            return 0
    
        return event.toXDR().length
    })
    
    const events_and_return_value_size = (
        events.reduce(
            (accumulator: number, currentValue: number) => accumulator + currentValue, // events
            sim.result?.retval.toXDR().length || 0 // return value size
        )
    )

    const sorobanTransactionData = sim.transactionData.build()
    const tx = SorobanRpc.assembleTransaction(simTx, sim).build()
    
    console.log({
        CPU_instructions: Number(sim.cost.cpuInsns),
        RAM: Number(sim.cost.memBytes),
        ledger_entry_reads: sorobanTransactionData.resources().footprint().readOnly().length,
        ledger_entry_writes: sorobanTransactionData.resources().footprint().readWrite().length,
        ledger_write_bytes: sorobanTransactionData.resources().writeBytes(),
        ledger_read_bytes: sorobanTransactionData.resources().readBytes(),
        events_and_return_value_size,
        min_transaction_size: Buffer.from(tx.toXDR(), 'base64').length,
        // This limit is the max single ledger key size.
        // It currently cannot be derived from either the tx or the simulation (boo)
        // (see https://discord.com/channels/897514728459468821/966788672164855829/1212887348191166484)
        // max_ledger_entry_size: 0
    })
}