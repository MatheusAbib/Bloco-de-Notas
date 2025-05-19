import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-no-tasks',
  imports: [],
  template: `
    <div class="flex flex-col w-full justify-center items-center mt-16">
      <img width="200" height="200" [alt]="alt" [src]="imageUrl" />

      <span class="text-xl text-primary font-bold">{{ message }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoTasksComponent {
  @Input() public alt!: string;

  @Input() public imageUrl!: string;

  @Input() public message!: string;
}
