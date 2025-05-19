import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainListComponent } from '../../components/main-list/main-list.component';
import { ColorsListComponent } from '../../components/colors-list/colors-list.component';

const COMPONENTS = [MainListComponent, ColorsListComponent];

@Component({
  selector: 'app-category',
  imports: [...COMPONENTS],
  template: `
    <div class="flex flex-col justify-between h-full w-full">
      <!-- main-list -->
      <app-main-list />

      <!-- colors-list -->
      <app-colors-list />
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent {}
