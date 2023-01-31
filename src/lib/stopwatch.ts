import { Cell, Formula, Reactive, Resource } from '@starbeam/universal';

export function Stopwatch({
  locale = undefined,
  timeZone = undefined,
  dateStyle = 'full',
  timeStyle = 'full',
}: {
  locale?: IntoReactive<string | undefined>;
  timeZone?: string;
  dateStyle?: IntoReactive<Intl.DateTimeFormatOptions['dateStyle']>;
  timeStyle?: IntoReactive<Intl.DateTimeFormatOptions['dateStyle']>;
} = {}) {
  return Resource(({ on, id }) => {
    const time = Cell(new Date());

    const timer = setInterval(() => {
      time.set(new Date());
    }, 1000);

    on.cleanup(() => clearInterval(timer));

    return Formula(() => {
      const formatter = new Intl.DateTimeFormat(read(locale), {
        dateStyle: read(dateStyle),
        timeStyle: read(timeStyle),
        timeZone: read(timeZone),
      });

      return `(id=${id}) ${formatter.format(time.current)}`;
    });
  });
}

// These are in 0.9 natively.
type IntoReactive<T> = T | Reactive<T>;

function read<T>(value: T | Reactive<T>): T {
  if (Reactive.is(value)) {
    return value.current;
  } else {
    return value;
  }
}
