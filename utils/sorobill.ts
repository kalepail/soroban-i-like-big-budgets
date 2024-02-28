import { SorobanRpc } from '@stellar/stellar-sdk'

export function sorobill(sim: SorobanRpc.Api.SimulateTransactionSuccessResponse) {
    const events = sim.events.map((event) => {
        if (event.event().type().name === 'diagnostic')
            return 0
    
        return event.toXDR().length
    })
    
    const events_and_return_value_size = (
        events.reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0) // events
        + (sim.result?.retval.toXDR().length || 0) // return value size
    )

    const sorobanTransactionData = sim.transactionData.build()
    
    console.log({
        CPU_instructions: Number(sim.cost.cpuInsns),
        RAM: Number(sim.cost.memBytes),
        ledger_entry_reads: sorobanTransactionData.resources().footprint().readOnly().length,
        ledger_entry_writes: sorobanTransactionData.resources().footprint().readWrite().length,
        // transaction_size: 0,
        ledger_write_bytes: sorobanTransactionData.resources().writeBytes(),
        ledger_read_bytes: sorobanTransactionData.resources().readBytes(),
        events_and_return_value_size,
        // ledger_entry_size: 0
    })
}