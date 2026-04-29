#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, Env, String, Vec, Map,
};

// ── Error Types ──
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum SplitSaveError {
    GroupNotFound    = 1,
    AlreadyExists    = 2,
    Unauthorized     = 3,
    InvalidAmount    = 4,
}

// ── Data Types ──
#[contracttype]
#[derive(Clone)]
pub struct Group {
    pub id:          String,
    pub name:        String,
    pub creator:     Address,
    pub created_at:  u64,
    pub total_expenses: i128,
    pub settlement_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Settlement {
    pub from:      Address,
    pub to:        Address,
    pub amount:    i128,
    pub timestamp: u64,
    pub group_id:  String,
}

// ── Storage Keys ──
#[contracttype]
pub enum DataKey {
    Group(String),
    GroupCount,
    Settlements(String),
    Admin,
}

// ── Contract ──
#[contract]
pub struct SplitSaveContract;

#[contractimpl]
impl SplitSaveContract {

    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GroupCount, &0u32);
    }

    /// Create a new expense group
    pub fn create_group(
        env: Env,
        creator: Address,
        group_id: String,
        name: String,
    ) -> Result<(), SplitSaveError> {
        creator.require_auth();

        // Check group doesn't already exist
        if env.storage().persistent().has(&DataKey::Group(group_id.clone())) {
            return Err(SplitSaveError::AlreadyExists);
        }

        let group = Group {
            id:               group_id.clone(),
            name,
            creator,
            created_at:       env.ledger().timestamp(),
            total_expenses:   0,
            settlement_count: 0,
        };

        env.storage().persistent().set(&DataKey::Group(group_id.clone()), &group);

        // Increment group count
        let count: u32 = env.storage().instance().get(&DataKey::GroupCount).unwrap_or(0);
        env.storage().instance().set(&DataKey::GroupCount, &(count + 1));

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("grp_new"),),
            group_id
        );

        Ok(())
    }

    /// Record a settlement between two parties
    pub fn record_settlement(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
        group_id: String,
    ) -> Result<(), SplitSaveError> {
        from.require_auth();

        if amount <= 0 {
            return Err(SplitSaveError::InvalidAmount);
        }

        // Check group exists
        if !env.storage().persistent().has(&DataKey::Group(group_id.clone())) {
            return Err(SplitSaveError::GroupNotFound);
        }

        // Update group stats
        let mut group: Group = env.storage().persistent()
            .get(&DataKey::Group(group_id.clone())).unwrap();
        group.total_expenses   += amount;
        group.settlement_count += 1;
        env.storage().persistent().set(&DataKey::Group(group_id.clone()), &group);

        // Emit settlement event
        env.events().publish(
            (soroban_sdk::symbol_short!("settled"),),
            (from, to, amount, group_id)
        );

        Ok(())
    }

    /// Get group info
    pub fn get_group(env: Env, group_id: String) -> Result<Group, SplitSaveError> {
        env.storage().persistent()
            .get(&DataKey::Group(group_id))
            .ok_or(SplitSaveError::GroupNotFound)
    }

    /// Get total number of groups
    pub fn get_group_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::GroupCount).unwrap_or(0)
    }

    /// Check if a group exists
    pub fn group_exists(env: Env, group_id: String) -> bool {
        env.storage().persistent().has(&DataKey::Group(group_id))
    }
}
