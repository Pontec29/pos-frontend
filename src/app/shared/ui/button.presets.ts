export type ButtonPresetKey =
  | 'primary'
  | 'secondary'
  | 'excel'
  | 'add'
  | 'danger'
  | 'export'
  | 'exportCsv'
  | 'exportPdf'
  | 'import'
  | 'print'
  | 'refresh'
  | 'filter'
  | 'search'
  | 'save'
  | 'cancel'
  | 'view'
  | 'edit'
  | 'delete'
  | 'download'
  | 'upload'
  | 'approve'
  | 'reject'
  | 'mail'
  | 'whatsapp'
  | 'call';

export type ButtonPreset = {
  severity?: 'primary' | 'success' | 'info' | 'help' | 'danger' | 'secondary' | 'help';
  outlined?: boolean;
  rounded?: boolean;
  size?: 'small' | 'large';
  icon?: string;
  text?: boolean;
  plain?: boolean;
  link?: boolean;
  raised?: boolean;
};

const PRESETS: Record<ButtonPresetKey, ButtonPreset> = {
  primary: { severity: 'primary', outlined: false, rounded: false },
  secondary: { severity: 'secondary', outlined: true, rounded: false },
  excel: { severity: 'success', outlined: false, rounded: false, icon: 'pi pi-file-excel' },
  add: { severity: 'primary', outlined: false, rounded: false, icon: 'pi pi-plus' },
  danger: { severity: 'danger', outlined: false, rounded: false },
  export: { severity: 'secondary', outlined: true, icon: 'pi pi-external-link' },
  exportCsv: { severity: 'secondary', outlined: true, icon: 'pi pi-download' },
  exportPdf: { severity: 'danger', outlined: true, icon: 'pi pi-file-pdf' },
  import: { severity: 'info', outlined: true, icon: 'pi pi-upload' },
  print: { severity: 'secondary', outlined: true, icon: 'pi pi-print' },
  refresh: { severity: 'secondary', outlined: true, icon: 'pi pi-refresh' },
  filter: { severity: 'secondary', text: true, icon: 'pi pi-filter' },
  search: { severity: 'secondary', text: true, icon: 'pi pi-search' },
  save: { severity: 'primary', icon: 'pi pi-check' },
  cancel: { severity: 'secondary', text: true, icon: 'pi pi-times' },
  view: { severity: 'secondary', outlined: true, rounded: true, size: 'small', icon: 'pi pi-eye' },
  edit: { severity: 'secondary', outlined: true, rounded: true, size: 'small', icon: 'pi pi-pencil' },
  delete: { severity: 'danger', outlined: true, rounded: true, size: 'small', icon: 'pi pi-trash' },
  download: { severity: 'secondary', outlined: true, icon: 'pi pi-download' },
  upload: { severity: 'secondary', outlined: true, icon: 'pi pi-upload' },
  approve: { severity: 'success', icon: 'pi pi-check-circle' },
  reject: { severity: 'danger', icon: 'pi pi-times-circle' },
  mail: { severity: 'info', outlined: true, icon: 'pi pi-envelope' },
  whatsapp: { severity: 'success', outlined: true, icon: 'pi pi-whatsapp' },
  call: { severity: 'info', outlined: true, icon: 'pi pi-phone' },
};

export function getButtonPreset(key?: ButtonPresetKey | null): ButtonPreset {
  if (!key) return {};
  return PRESETS[key] ?? {};
}
