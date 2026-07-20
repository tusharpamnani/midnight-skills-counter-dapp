import { describe, it, expect, beforeEach } from 'vitest';
import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger,
  type Ledger,
} from '../managed/counter/contract/index.js';

function createInitialContext() {
  return {
    initialZswapLocalState: { coinPublicKey: '0'.repeat(64) },
    initialPrivateState: {},
  };
}

function makeContext(stateData: any) {
  return __compactRuntime.createCircuitContext(
    __compactRuntime.dummyContractAddress(),
    '0'.repeat(64),
    stateData,
    {},
  );
}

describe('Counter Contract', () => {
  let contract: InstanceType<typeof Contract>;

  beforeEach(() => {
    contract = new Contract({});
  });

  describe('Contract Initialization', () => {
    it('should create a contract instance', () => {
      expect(contract).toBeDefined();
      expect(contract.circuits).toBeDefined();
      expect(contract.impureCircuits).toBeDefined();
    });

    it('should have an increment circuit', () => {
      expect(typeof contract.circuits.increment).toBe('function');
    });

    it('should have initialState method', () => {
      expect(typeof contract.initialState).toBe('function');
    });
  });

  describe('Initial State', () => {
    it('should initialize with round = 0', () => {
      const initialState = contract.initialState(createInitialContext());
      const state = ledger(initialState.currentContractState.data);
      expect(state.round).toBe(0n);
    });
  });

  describe('Increment Circuit', () => {
    it('should increment round by 1', () => {
      const initialState = contract.initialState(createInitialContext());
      const context = makeContext(initialState.currentContractState.data);

      const result = contract.circuits.increment(context);

      expect(result).toBeDefined();
      expect(result.result).toEqual([]);
      expect(result.context).toBeDefined();
    });

    it('should update state after increment', () => {
      const initialState = contract.initialState(createInitialContext());
      const context = makeContext(initialState.currentContractState.data);

      const result = contract.circuits.increment(context);

      expect(result.context.currentQueryContext.state).toBeDefined();

      const updatedState = ledger(result.context.currentQueryContext.state);
      expect(updatedState.round).toBe(1n);
    });
  });

  describe('Multiple Increments', () => {
    it('should handle multiple sequential increments', () => {
      const initialState = contract.initialState(createInitialContext());
      let currentStateData = initialState.currentContractState.data;

      let result = contract.circuits.increment(makeContext(currentStateData));
      currentStateData = result.context.currentQueryContext.state;

      let stateAfter1 = ledger(currentStateData);
      expect(stateAfter1.round).toBe(1n);

      result = contract.circuits.increment(makeContext(currentStateData));
      currentStateData = result.context.currentQueryContext.state;

      let stateAfter2 = ledger(currentStateData);
      expect(stateAfter2.round).toBe(2n);

      result = contract.circuits.increment(makeContext(currentStateData));
      currentStateData = result.context.currentQueryContext.state;

      let stateAfter3 = ledger(currentStateData);
      expect(stateAfter3.round).toBe(3n);
    });

    it('should increment 10 times correctly', () => {
      const initialState = contract.initialState(createInitialContext());
      let currentStateData = initialState.currentContractState.data;

      for (let i = 0; i < 10; i++) {
        const result = contract.circuits.increment(makeContext(currentStateData));
        currentStateData = result.context.currentQueryContext.state;
      }

      const finalState = ledger(currentStateData);
      expect(finalState.round).toBe(10n);
    });
  });

  describe('Ledger State Reading', () => {
    it('should read initial round as 0n', () => {
      const initialState = contract.initialState(createInitialContext());
      const state = ledger(initialState.currentContractState.data);
      expect(typeof state.round).toBe('bigint');
      expect(state.round).toBe(0n);
    });

    it('should read updated round after circuit execution', () => {
      const initialState = contract.initialState(createInitialContext());
      const context = makeContext(initialState.currentContractState.data);

      const result = contract.circuits.increment(context);
      const updatedState = ledger(result.context.currentQueryContext.state);

      expect(updatedState.round).toBe(1n);
    });
  });
});
