import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-reportes',
  imports: [
    TabsModule,
    SelectModule,
    AutoCompleteModule,
    FormsModule,
    ProgressSpinnerModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Reportes {

  // ! Pestañas
  tabIndex = signal<string | number | undefined>('0');

}
