import { defineComponent, getCurrentInstance, Slots } from 'vue';
import { render } from '../lib/counter';

export default defineComponent({
  setup(options, { slots }: { slots: Slots }) {
    return render(() => slots?.default?.());
  },
});
