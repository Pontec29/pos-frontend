import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabsModule } from 'primeng/tabs';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Módulos PrimeNG para tablas de datos
 * Incluye: Table, Paginación, Búsqueda, Iconos
 */
export const PRIMENG_TABLE_MODULES = [
  TableModule,
  PaginatorModule,
  IconFieldModule,
  InputIconModule,
  InputTextModule,
  ButtonModule,
  ToastModule,
  ToolbarModule,
  BreadcrumbModule
];

/**
 * Módulos PrimeNG para formularios en diálogos
 * Incluye: Dialog, Inputs, Selects, TextArea, Checkbox, InputNumber, TabView
 */
export const PRIMENG_FORM_MODULES = [
  DialogModule,
  ButtonModule,
  FloatLabelModule,
  InputTextModule,
  TextareaModule,
  SelectModule,
  CheckboxModule,
  InputNumberModule,
  TabsModule,
  DatePickerModule,
  AutoCompleteModule,
  ToggleSwitchModule
];

/**
 * Módulos PrimeNG para filtros
 * Incluye: DatePicker, Select, MultiSelect
 */
export const PRIMENG_FILTER_MODULES = [
  DatePickerModule,
  SelectModule,
  MultiSelectModule,
  IconFieldModule,
  InputIconModule
];
