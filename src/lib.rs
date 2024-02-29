#![no_std]

use soroban_sdk::{contract, contractimpl, Bytes, Env};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn run(
        env: Env,
        gimme_cpu: Option<u32>,
        gimme_mem: Option<u32>,
        gimme_storage: Option<u32>,
        gimme_events: Option<u32>,
    ) {
        if gimme_cpu.is_some() {
            let iters = gimme_cpu.unwrap();

            for _ in 0..iters {
                env.crypto().sha256(&env.prng().gen_len(32));
            }
        }

        if gimme_mem.is_some() {
            let mut bytes = Bytes::new(&env);
            let iters = gimme_mem.unwrap();

            for i in 0..iters {
                bytes.push_back(i as u8)
            }
        }

        if gimme_storage.is_some() {
            let iters = gimme_storage.unwrap();

            for i in 0..iters {
                env.storage().persistent().set(&i, &i);
            }
        }

        if gimme_events.is_some() {
            let iters = gimme_events.unwrap();

            for i in 0..iters {
                env.events()
                    .publish((i,), env.prng().gen_len::<Bytes>(1000));
            }
        }
    }
}

mod test;
