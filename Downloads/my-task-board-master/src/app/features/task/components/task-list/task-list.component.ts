import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { AsyncPipe } from '@angular/common';
import { NoTasksComponent } from '../no-tasks/no-tasks.component';

@Component({
  selector: 'app-task-list',
  imports: [AsyncPipe, NoTasksComponent],
  template: `
    <div class="mt-8">
      @if (tasks$ | async) {
        @if (numberOfTasks() > 0) {
          @for (task of tasks(); track task.id) {
            <div class="flex flex-row justify-start mb-b items-center gap-4">
              <span>{{ task.title }}</span>
              <!-- <app-update-task /> -->

              <!-- <app-delete-task /> -->
            </div>
          }
        } @else {
          <app-no-tasks
            alt="Nenhuma tarefa adicionad"
            imageUrl="no_data.svg"
            message="Nenhuma tarefa adicionada 😔" />
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private tasksService = inject(TaskService);

  public tasks$ = this.tasksService.getTasks();

  public tasks = this.tasksService.tasks;

  public numberOfTasks = this.tasksService.numberOfTasks;
}
