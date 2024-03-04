#![no_std]

use soroban_sdk::{contract, contractimpl, Bytes, Env};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env) {
        env.storage().persistent().set(
            &Bytes::from_array(&env, &[u8::MAX; 300]),
            &Bytes::from_array(&env, &[0u8; 133_120]),
        );
    }
    pub fn run(
        env: Env,
        cpu: Option<u32>,
        mem: Option<u32>,
        set: Option<u32>,
        get: Option<u32>,
        events: Option<u32>,
        _txn: Option<Bytes>,
    ) {
        // "txMaxInstructions": "100000000",
        if cpu.is_some() {
            let iters = cpu.unwrap();

            for _ in 0..iters {
                env.crypto().sha256(&env.prng().gen_len(1_024));
            }
        }

        // "txMemoryLimit": 41943040
        if mem.is_some() {
            let mut bytes = Bytes::new(&env);
            let iters = mem.unwrap();

            for i in 0..iters {
                bytes.insert_from_bytes(i, Bytes::from_array(&env, &[0u8; 1_024]))
            }
        }

        if set.is_some() {
            let iters = set.unwrap();

            // "txMaxWriteBytes": 66560,
            // "contractDataEntrySizeBytes": 65536,
            env.storage().persistent().set(
                &Bytes::from_array(&env, &[u8::MIN; 300]),
                &Bytes::from_array(&env, &[0u8; 66_560]),
            );

            // "txMaxWriteLedgerEntries": 20,
            for i in 0..iters {
                env.storage().persistent().set(&[u8::MIN, i as u8], &true); // NOTE due to key being an array we can only really test up to 256 reads
            }
        }

        if get.is_some() {
            let iters = get.unwrap();

            // "contractDataKeySizeBytes": 300,
            // "txMaxReadBytes": 133120,
            env.storage()
                .persistent()
                .get::<Bytes, Bytes>(&Bytes::from_array(&env, &[u8::MAX; 300]))
                .unwrap_or(Bytes::new(&env));

            // "txMaxReadLedgerEntries": 40,
            for i in 0..iters {
                env.storage()
                    .persistent()
                    .get::<[u8; 2], bool>(&[u8::MAX, i as u8]) // NOTE due to key being an array we can only really test up to 256 writes
                    .unwrap_or(true);
            }
        }

        // "txMaxContractEventsSizeBytes": 8198
        if events.is_some() {
            let iters = events.unwrap();

            for i in 0..iters {
                env.events()
                    .publish((i,), Bytes::from_array(&env, &[8u8; 8_198]));
            }
        }
    }
}

mod test;
