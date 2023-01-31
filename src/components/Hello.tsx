import { Cell } from '@starbeam/universal';
import { verified } from '@starbeam/verify';
import { defineComponent, ref, VNode } from 'vue';
import { Counter } from '../lib/counter';
import { Form } from '../lib/form';
import {
  DateStyle,
  DATE_STYLE,
  isValidLocale,
  SYS_LOCALE,
  SYS_TZ,
  TimeStyle,
  TIME_STYLE,
} from '../lib/intl';
import { create, use, intoCell, intoVue } from '../lib/starbeam';
import { Stopwatch } from '../lib/stopwatch';

export default defineComponent({
  props: { msg: String },
  setup(props) {
    const counter = create(Counter);

    const locale = Cell(SYS_LOCALE);
    const timeZone = Cell(SYS_TZ);

    const dateStyle = ref(DATE_STYLE[1] as DateStyle);
    const timeStyle = ref(TIME_STYLE[1] as TimeStyle);

    const state = intoVue({
      locale,
      timeZone,
      dateStyle,
      timeStyle,
    });

    console.log({ state });

    const error = Cell(undefined as string | undefined);

    const clock = use(() =>
      Stopwatch({
        locale,
        dateStyle: intoCell(dateStyle),
        timeStyle: intoCell(timeStyle),
      })
    );

    const OptionsForm = () => {
      function update(e: Event) {
        e.preventDefault();
        const data = getData();
        dateStyle.value = data.dateStyle;
        timeStyle.value = data.timeStyle;

        if (!isValidLocale(data.locale)) {
          error.current = `Invalid locale: ${data.locale}`;
        }

        locale.current = data.locale;

        if (data.utc) {
          timeZone.current = 'UTC';
        } else {
          timeZone.current = SYS_TZ;
        }
      }

      const { form, getData } = Form(
        { onSubmit: update, onInput: update },
        (f) =>
          f
            .text(
              'locale',
              { defaultValue: locale.current },
              { wrap: label('Locale') }
            )
            .checkbox(
              'utc',
              { checked: locale.current === 'UTC' },
              { wrap: label('UTC') }
            )
            .select('dateStyle', DATE_STYLE, {
              options: (s) => ({ value: s, selected: s === dateStyle.value }),
              wrap: label('Date Style'),
            })
            .select('timeStyle', TIME_STYLE, {
              options: (s) => ({ value: s, selected: s === timeStyle.value }),
              wrap: label('Time Style'),
            })
      );

      return form;
    };

    return () => {
      return (
        <div>
          <h2>In JSX</h2>
          <p>msg: {props.msg}</p>
          <h3>Counter</h3>
          <button onClick={counter.increment}>{counter.count}</button>

          <h3>Clock</h3>
          <OptionsForm />
          <p>{clock.current}</p>

          <dl class="data" aria-label="state">
            <dt>locale</dt>
            <dd>{locale.current}</dd>
            <dt>timeZone</dt>
            <dd>{timeZone.current}</dd>
            <dt>dateStyle</dt>
            <dd>{dateStyle.value}</dd>
            <dt>timeStyle</dt>
            <dd>{timeStyle.value}</dd>
          </dl>
        </div>
      );
    };
  },
});

const label = (label: string, error?: string) => (node: VNode) =>
  (
    <label>
      <span>{label}</span>
      {node}
      {error ? <span class="error">{error}</span> : null}
    </label>
  );
