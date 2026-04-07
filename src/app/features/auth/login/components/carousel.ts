import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { Carousel, CarouselModule } from 'primeng/carousel';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { CarouselItemComponent } from './carousel-item';
import { CarouselItem } from '../domain/carousel.interface';

@Component({
  selector: 'app-auth-carousel',
  standalone: true,
  imports: [CarouselModule, CarouselItemComponent, FormsModule, NgClass],
  template: `
    <div class="carousel-container">
      <div class="title-section">
        <h1>Administra todo tu negocio desde una sola plataforma unificada y eficiente.</h1>
        <span>Protege tu información valiosa con características de seguridad de nivel empresarial.</span>
      </div>
      <p-carousel
        [value]="items()"
        [numVisible]="1"
        [numScroll]="1"
        [circular]="true"
        [autoplayInterval]="autoplayInterval"
        [showIndicators]="false"
        [showNavigators]="false"
        class="custom-carousel"
        contentClass="h-full"
        (onPage)="onPageChange($event)"
      >
        <ng-template let-item pTemplate="item">
          <app-carousel-item [item]="item" />
        </ng-template>
      </p-carousel>

      <div class="custom-indicators">
        @for (item of items(); track item.id; let i = $index) {
          <button
            class="indicator"
            [ngClass]="{'active': i === activeIndex()}"
            (click)="onIndicatorClick(i)"
            [attr.aria-label]="'Go to slide ' + (i + 1)"
          >
            @if (i === activeIndex()) {
              <div class="progress-bar" [style.animation-duration]="autoplayInterval + 'ms'"></div>
            }
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .carousel-container {
      height: 100%;
      width: 100%;
      position: relative;
      overflow: hidden;
    }

    .title-section {
      h1 {
        font-size: 2.25rem;
        line-height: 2.5rem;
        font-weight: 700;
        color: var(--text-white, #FFF);
        margin-bottom: 1rem;
      }
      span {
        font-size: 1.125rem;
        line-height: 1.75rem;
        color: var(--text-white, #FFF);
        margin-bottom: 2rem;
        opacity: 0.8;
      }
    }

    ::ng-deep .custom-carousel {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    ::ng-deep .custom-carousel .p-carousel-content {
      flex: 1;
      height: 100%;
    }

    ::ng-deep .custom-carousel .p-carousel-container {
      height: 100%;
    }

    ::ng-deep .custom-carousel .p-carousel-item {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .custom-indicators {
      position: absolute;
      bottom: 0;
      right: 1.5rem;
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      z-index: 20;
    }

    .indicator {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.3);
      border: none;
      padding: 0;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .indicator.active {
      width: 2.5rem;
      background-color: rgba(255, 255, 255, 0.3);
    }

    .progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background-color: #ffffff;
      width: 0%;
      animation-name: progress;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
      border-radius: 9999px;
    }

    @keyframes progress {
      from { width: 0%; }
      to { width: 100%; }
    }

    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCarouselComponent {
  @ViewChild(Carousel) carousel!: Carousel;

  autoplayInterval = 5000;
  activeIndex = signal(0);

  items = signal<CarouselItem[]>([
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
      alt: 'Administra todo tu negocio desde una sola plataforma unificada y eficiente.'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop',
      alt: 'Protege tu información valiosa con características de seguridad de nivel empresarial.'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
      alt: 'Toma decisiones informadas con reportes y estadísticas actualizadas al instante.'
    }
  ]);

  onPageChange(event: any) {
    this.activeIndex.set(event.page);
  }

  onIndicatorClick(index: number) {
    this.activeIndex.set(index);
    if (this.carousel) {
      this.carousel.page = index;
    }
  }
}

