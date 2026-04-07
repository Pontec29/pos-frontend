import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import Sidebar from './sidebar/sidebar';
import { HeaderComponent } from './header/header';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, HeaderComponent],
  providers: [MessageService],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export default class Layout {
  isSidebarCollapsed = signal(true);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }
}
