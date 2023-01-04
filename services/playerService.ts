import { signal } from "@preact/signals";
import { assign, interpret,createMachine } from 'xstate';

interface CounterMachineContext {
  count: number;
}

const increment = (context: CounterMachineContext) => context.count + 1;
const decrement = (context: CounterMachineContext) => context.count - 1;

const counterMachine = createMachine<CounterMachineContext>({
  initial: 'active',
  context: {
    count: 0
  },
  states: {
    active: {
      on: {
        INC: { actions: assign({ count: increment }) },
        DEC: { actions: assign({ count: decrement }) }
      }
    }
  }
});

const counterSignal = signal(counterMachine.getInitialState('active'));

const counterService = interpret(counterMachine)
  .onTransition((state) => counterSignal.value = state)
  .start();

export {
  counterSignal,
  counterService
}
