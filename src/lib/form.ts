import { expected, isEqual, verified, verify } from '@starbeam/verify';
import {
  FormHTMLAttributes,
  h,
  HTMLAttributes,
  InputHTMLAttributes,
  OptionHTMLAttributes,
  ref,
  VNode,
  VNodeArrayChildren,
} from 'vue';

export function Form<T>(
  options: FormHTMLAttributes,
  build: (builder: FormBuilder<{}>) => FormBuilder<T>
): ToForm<T> {
  const builder = new FormBuilder<{}>();
  const built = build(builder);
  return built.toForm(options);
}

interface ToForm<T> {
  readonly form: VNode;
  getData: () => T;
}

export class FormBuilder<T> {
  readonly #jsx: VNodeArrayChildren = [];

  text<N extends string>(
    name: N,
    options: (() => InputHTMLAttributes) | InputHTMLAttributes,
    { wrap = (vnode) => vnode }: { wrap?: (options: VNode) => VNode } = {}
  ): FormBuilder<T & { [P in N]: string }> {
    const attrs = typeof options === 'function' ? options() : options;
    this.#jsx.push(wrap(h('input', { name, type: 'text', ...attrs })));

    return this as any;
  }

  checkbox<N extends string>(
    name: N,
    options: (() => InputHTMLAttributes) | InputHTMLAttributes,
    { wrap = (vnode) => vnode }: { wrap?: (options: VNode) => VNode } = {}
  ): FormBuilder<T & { [P in N]: boolean }> {
    const attrs = typeof options === 'function' ? options() : options;
    this.#jsx.push(wrap(h('input', { name, type: 'checkbox', ...attrs })));

    return this as any;
  }

  select<Item, Value, N extends string>(
    name: N,
    items: Iterable<Item>,
    {
      options: createOption,
      wrap = (vnode) => vnode,
    }: {
      options: (item: Item) => OptionHTMLAttributes & { value: Value };
      wrap?: (option: VNode) => VNode;
    }
  ): FormBuilder<T & { [P in N]: Value }> {
    const options = [...items].map((item) => {
      const attrs = createOption(item);
      return h('option', attrs, [attrs.value]);
    });
    this.#jsx.push(wrap(h('select', { name }, options)));
    return this as any;
  }

  toForm(options: FormHTMLAttributes): ToForm<T> {
    const formRef = ref(null);
    const form = h('form', { ref: formRef, ...options }, this.#jsx);

    return {
      form,
      getData: () => {
        const data = new FormData(formRef.value!);
        return Object.fromEntries(data) as unknown as T;
      },
    };
  }
}

type FormEvent = Event & { currentTarget: HTMLFormElement };

function isFormEvent(e: Event): e is FormEvent {
  return !!e.currentTarget && e.currentTarget instanceof HTMLFormElement;
}
