import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InclusionFormComponent } from '../../components/inclusion-form/inclusion-form.component';
import { TaskListComponent } from '../../components/task-list/task-list.component';

const COMPONENTS = [InclusionFormComponent, TaskListComponent];

@Component({
  selector: 'app-task',
  imports: [...COMPONENTS],
  template: `
    <div class="flex flex-col mx-10">
      <!-- Título -->
      <span class="font-bold text-4xl">Meu quadro de tarefas</span>

      <!-- Formulário -->
      <app-inclusion-form />

      <!-- Lista de tarefas -->
      <app-task-list />
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComponent {}
