import { Component, ViewChild, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { HeaderComponent } from '../components/header/header.component';
import { SidenavComponent } from '../components/sidenav/sidenav.component';

/**
 * Componente MainLayout (P-GEN-003)
 * Shell/Container principal de la aplicación
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    HeaderComponent,
    SidenavComponent
  ],
  template: `
    <div class="main-layout">
      <app-header (toggleSidebar)="sidenav.toggle()"></app-header>

      <mat-sidenav-container class="sidenav-container" autosize>
        <mat-sidenav
          #sidenav
          [mode]="isMobile() ? 'over' : 'side'"
          [opened]="!isMobile()"
          class="main-sidenav"
          [fixedInViewport]="isMobile()"
          fixedTopGap="64"
        >
          <app-sidenav (menuItemClicked)="onMenuItemClicked()"></app-sidenav>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .main-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .sidenav-container {
      flex: 1;
      overflow: hidden;
    }

    .main-sidenav {
      width: 260px;
      border-right: 1px solid #e0e0e0;
    }

    .main-content {
      background-color: var(--claro-bg-light);
      min-height: 100%;
      overflow-x: hidden;
    }

    @media (max-width: 768px) {
      .main-sidenav {
        width: 280px;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
      }

      .main-content {
        padding: 0;
      }
    }
  `]
})
export class MainLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = signal(false);

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile.set(window.innerWidth <= 768);
  }

  onMenuItemClicked() {
    if (this.isMobile()) {
      this.sidenav.close();
    }
  }
}
