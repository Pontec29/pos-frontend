import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CarouselItem } from '../domain/carousel.interface';

@Component({
  selector: 'app-carousel-item',
  standalone: true,
  imports: [],
  template: `
    <div class="carousel-item">
      <div class="image-container">
        <img
          [src]="item().image"
          [alt]="item().alt"
          loading="lazy"
          class="carousel-image"
        />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .carousel-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1.5rem;
      height: 100%;
      opacity: 0;
      animation: fadeIn 0.5s ease-out forwards;
    }

    .image-container {
      position: relative;
      width: 100%;
      // max-width: 28rem;
      aspect-ratio: 16 / 9;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 15px 25px -12px rgba(0, 0, 0, 0.25);
    }

    .carousel-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 700ms;
    }

    .carousel-image:hover {
      transform: scale(1.05);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarouselItemComponent {
  item = input.required<CarouselItem>();
}
