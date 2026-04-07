import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonPresetKey, getButtonPreset } from './button.presets';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  template: `
    <p-button
      [label]="label ?? ''"
      [icon]="finalIcon()"
      [severity]="finalSeverity()"
      [outlined]="finalOutlined()"
      [rounded]="finalRounded()"
      [size]="finalSize()"
      [text]="finalText()"
      [plain]="finalPlain()"
      [link]="finalLink()"
      [raised]="finalRaised()"
      [disabled]="disabled"
      [loading]="loading"
      [attr.aria-label]="ariaLabel"
      [attr.aria-pressed]="ariaPressed"
      [attr.aria-haspopup]="ariaHaspopup"
      [attr.aria-controls]="ariaControls"
      [attr.aria-expanded]="ariaExpanded"
      [pTooltip]="tooltip"
      [tooltipPosition]="tooltipPosition"
      (click)="handleClick()"
      [styleClass]="styleClass"
    ></p-button>
  `,
})
export class AppButton {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() type?: 'primary' | 'success' | 'info' | 'help' | 'danger' | 'secondary';
  @Input() severity?: 'primary' | 'success' | 'info' | 'help' | 'danger' | 'secondary';
  @Input() outlined?: boolean;
  @Input() rounded?: boolean;
  @Input() size?: 'small' | 'large';
  @Input() text?: boolean;
  @Input() plain?: boolean;
  @Input() link?: boolean;
  @Input() raised?: boolean;
  @Input() disabled?: boolean;
  @Input() loading?: boolean;
  @Input() tooltip?: string;
  @Input() tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() styleClass?: string;
  @Input() ariaLabel?: string;
  @Input() ariaPressed?: boolean | 'true' | 'false' | null;
  @Input() ariaHaspopup?: string;
  @Input() ariaControls?: string;
  @Input() ariaExpanded?: boolean | 'true' | 'false' | null;
  @Input() preset?: ButtonPresetKey | null;
  @Input() onClick?: () => void;
  @Output() clicked = new EventEmitter<void>();

  private presetCfg = computed(() => getButtonPreset(this.preset));

  finalIcon = computed(() => this.icon ?? this.presetCfg().icon);
  finalSeverity = computed(() => this.type ?? this.severity ?? this.presetCfg().severity ?? 'primary');
  finalOutlined = computed(() => (this.outlined ?? this.presetCfg().outlined) ?? false);
  finalRounded = computed(() => (this.rounded ?? this.presetCfg().rounded) ?? false);
  finalSize = computed(() => this.size ?? this.presetCfg().size);
  finalText = computed(() => (this.text ?? this.presetCfg().text) ?? false);
  finalPlain = computed(() => (this.plain ?? this.presetCfg().plain) ?? false);
  finalLink = computed(() => (this.link ?? this.presetCfg().link) ?? false);
  finalRaised = computed(() => (this.raised ?? this.presetCfg().raised) ?? false);

  handleClick() {
    try {
      this.onClick?.();
    } finally {
      this.clicked.emit();
    }
  }
}
