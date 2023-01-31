import { Cell, PolledFormula, Reactive, TIMELINE } from '@starbeam/universal';
import {
  computed,
  customRef,
  getCurrentInstance,
  onScopeDispose,
  onUnmounted,
  onUpdated,
  ref,
  shallowRef,
} from 'vue';

export function Counter() {
  const count = Cell(0);
  const instance = getCurrentInstance();

  function increment() {
    console.log('incrementing');
    count.current++;
  }

  return {
    get count() {
      return count.current;
    },

    increment,
  };
}

export function render<T>(fn: () => T) {
  const formula = PolledFormula(fn);
  const instance = getCurrentInstance();

  TIMELINE.on.change(formula, () => {
    instance?.proxy?.$forceUpdate();
  });

  return formula;
}

export function use<T>(fn: () => T) {
  const formula = PolledFormula(fn);
  const marker = ref({});

  const stop = TIMELINE.on.change(formula, () => {
    marker.value = {};
  });

  return computed(() => {
    marker.value;
    return formula.current;
  });
}
