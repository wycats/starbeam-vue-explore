import {
  ComputedGetter,
  ComputedRef,
  customRef,
  getCurrentInstance,
  isRef,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  Plugin,
  reactive,
  ref,
  Ref,
  watch,
} from 'vue';
import { CONTEXT, LIFETIME, TIMELINE } from '@starbeam/timeline';
import { Desc, Description } from '@starbeam/debug';
import { ComponentFrame } from './frame';
import {
  Cell,
  Factory,
  Formula,
  PolledFormula,
  Reactive,
  ResourceBlueprint,
} from '@starbeam/universal';
import { isPresent, verified, verify } from '@starbeam/verify';

export function getCurrentComponent(): ComponentFrame | null {
  const vueInstance = verified(getCurrentInstance(), isPresent);
  return ComponentFrame.get(vueInstance);
}

export const starbeam: Plugin = {
  install: (app) => {
    app.mixin({
      beforeMount() {
        CONTEXT.app = app;
        // console.log('before mount', this);
      },
      mounted() {
        // console.log('mounted', this);
      },
      beforeUpdate() {
        CONTEXT.app = app;
        // console.log('before update', this);
      },
      updated() {
        // console.log('updated', this);
      },
    });
  },
};

const REACTIVE_INSTANCES = new WeakSet();
type IntoResource<T, Default extends undefined> =
  | ResourceBlueprint<T, Default>
  | (() => ResourceBlueprint<T, Default>)
  | (() => T);

export function create<T>(
  callback: () => T,
  description?: string | Description
): T {
  const desc = Desc('external', description);
  useReactive({ description: desc });

  return callback();
}

export function intoCell<R extends IntoVueRef>(ref: R): CellOf<R> {
  if (Reactive.is(ref)) {
    return ref as any
  }

  const cell = Cell(ref.value);

  watch(ref, (value) => {
    console.log('watch fired', { value });
    cell.current = value;
  });

  return cell as any;
}

type IntoVueRef =  Reactive<unknown> | Ref<unknown>;

type ValueOf<I extends IntoVueRef> = I extends Reactive<infer T> ? T : I extends Ref<infer T> ? T : never;

type CellOf<I extends IntoVueRef> = I extends Reactive<infer T> ? Reactive<T> : I extends Ref<infer T> ? Reactive<T> : never;

type IntoVueReactive = Record<
  string,
  IntoVueRef
>;

type VueReactiveOf<R extends IntoVueReactive> = {
  [P in keyof R]: R[P] extends infer T extends IntoVueRef ? ValueOf<T> : never;
};

type CellsOf<R extends IntoVueReactive> = {
  [P in keyof R]: R[P] extends infer T extends IntoVueRef ? Reactive<ValueOf<T>> : never;
};


type VueRefOf<R extends IntoVueRef> = Readonly<
  Ref<
    R extends Reactive<infer V>
      ? V
      : R extends Ref<infer T>
      ? T
      : never
  >
>;

export function intoVue<T>(reactive: Reactive<T>): Readonly<Ref<T>>;
export function intoVue<R extends IntoVueReactive>(record: R): VueReactiveOf<R>;
export function intoVue(
  reactive: Reactive<unknown> | IntoVueReactive
): Readonly<Ref<unknown>> | VueReactiveOf<{}> {
  if (Reactive.is(reactive)) {
    return intoRef(reactive);
  } else {
    return intoVueReactive(reactive);
  }
}


export function intoVueReactive<R extends IntoVueReactive>(
  record: R
): VueReactiveOf<R> {
  return reactive(
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, intoRef(value)])
    )
  ) as VueReactiveOf<R>;
}

export function intoCells<R extends IntoVueReactive>(record: R): CellsOf<R> {}


export function intoRef<R extends IntoVueRef>(reactive:R): VueRefOf<R> {
  if (isRef(reactive)) {
    return reactive as VueRefOf<R>;
  }

  return customRef((track, trigger) => {
    const done = TIMELINE.on.change(reactive, trigger);

    onBeforeUnmount(done);

    return {
      get: () => {
        track();
        return reactive.current;
      },

      set: () => {
        throw Error(`formula() returns a readonly ref`);
      },
    };
  }) as VueRefOf<R>;
}

export function formula<T>(formula: (() => T) | Reactive<T>): Readonly<Ref<T>> {
  const reactive = Reactive.is(formula) ? formula : PolledFormula(formula);

  return customRef((track, trigger) => {
    const done = TIMELINE.on.change(reactive, trigger);

    onBeforeUnmount(done);

    return {
      get: () => {
        track();
        return reactive.current;
      },

      set: () => {
        throw Error(`formula() returns a readonly ref`);
      },
    };
  });
}

export function use<T, Default extends undefined>(
  callback: () => ResourceBlueprint<T, never>,
  description?: string | Description
): Reactive<T>;
export function use<T, Default extends undefined>(
  callback: () => T,
  description?: string | Description
): Reactive<T>;
export function use<T>(
  callback: ResourceBlueprint<T, never>,
  description?: string | Description
): Reactive<T>;
export function use<T, Default extends undefined>(
  callback: IntoResource<T, Default>,
  description?: string | Description
): T | Reactive<T> {
  const desc = Desc('external', description);
  useReactive({ description: desc });

  return Factory.resource(callback, verified(getCurrentComponent(), isPresent));
}

export function useReactive({
  description,
}: {
  description?: string | Description;
} = {}) {
  const desc = Desc('external', description);

  const instance = getCurrentInstance()!;
  ComponentFrame.create(instance, desc);

  if (REACTIVE_INSTANCES.has(instance)) {
    return;
  }

  REACTIVE_INSTANCES.add(instance);

  function start() {
    ComponentFrame.start(instance, desc);
  }

  function end() {
    ComponentFrame.end(instance, () => {
      instance.proxy?.$forceUpdate();
    });
  }

  function unmount() {
    ComponentFrame.unmount(instance);
    LIFETIME.finalize(instance);
  }

  onBeforeMount(start);
  onMounted(end);
  onBeforeUpdate(start);
  onUpdated(end);

  onBeforeUnmount(unmount);
}
