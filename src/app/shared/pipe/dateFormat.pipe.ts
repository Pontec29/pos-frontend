import { Pipe, PipeTransform } from '@angular/core';

type DateFormat = 'long' | 'short' | 'medium' | 'time' | 'datetime';

interface FormatConfig {
  options: Intl.DateTimeFormatOptions;
  template: (parts: Record<string, string>) => string;
}

const FORMAT_MAP: Record<DateFormat, FormatConfig> = {
  // 03 Marzo 2026
  long: {
    options: { day: '2-digit', month: 'long', year: 'numeric' },
    template: (p) => `${p['day']} ${capitalize(p['month'])} ${p['year']}`,
  },
  // 03/03/2026
  short: {
    options: { day: '2-digit', month: '2-digit', year: 'numeric' },
    template: (p) => `${p['day']}/${p['month']}/${p['year']}`,
  },
  // 03 Mar 2026
  medium: {
    options: { day: '2-digit', month: 'short', year: 'numeric' },
    template: (p) => `${p['day']} ${capitalize(p['month'])} ${p['year']}`,
  },
  // 02:57 p. m.
  time: {
    options: { hour: '2-digit', minute: '2-digit', hour12: true },
    template: (p) => `${p['hour']}:${p['minute']} ${p['dayPeriod'] ?? ''}`.trim(),
  },
  // 03 Marzo 2026, 02:57 p. m.
  datetime: {
    options: { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true },
    template: (p) =>
      `${p['day']} ${capitalize(p['month'])} ${p['year']}, ${p['hour']}:${p['minute']} ${p['dayPeriod'] ?? ''}`.trim(),
  },
};

function capitalize(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function parseToParts(date: Date, options: Intl.DateTimeFormatOptions): Record<string, string> {
  return new Intl.DateTimeFormat('es-PE', options)
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});
}

@Pipe({
  name: 'dateFormat',
  standalone: true,
  pure: true,
})
export class DateFormatPipe implements PipeTransform {

  transform(
    value: string | Date | null | undefined,
    format: DateFormat = 'long',
  ): string {
    if (value === null || value === undefined || value === '') return '—';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '—';

    const config = FORMAT_MAP[format] ?? FORMAT_MAP['long'];
    const parts  = parseToParts(date, config.options);

    return config.template(parts);
  }
}
