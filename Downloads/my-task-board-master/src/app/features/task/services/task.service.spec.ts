import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';

import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TaskService } from './task.service';
import {
  task,
  TASK_INTERNAL_SERVER_ERROR_RESPONSE,
  TASK_UNPROCESSIBLE_ENTITY_RESPONSE,
  tasks,
} from '../../../__mocks__/task';
import { Task } from '../model/task.model';

describe('TaskService', () => {
  let taskService: TaskService;
  let httpTestingController: HttpTestingController;

  const MOCKED_TASKS = tasks;

  const MOCKED_TASK = task;

  const apiUrl = 'http://localhost:3000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    taskService = TestBed.inject(TaskService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('creates service', () => {
    expect(taskService).toBeTruthy();
  });

  it('getSortedTasks', () => {
    const sortedTasks = taskService.getSortedTasks(tasks);
    expect(sortedTasks[0].title).toEqual('Comprar pão na padaria');
  });

  describe('getTasks', () => {
    it('should return a list of tasks', waitForAsync(() => {
      taskService.getTasks().subscribe(response => {
        expect(response).toEqual(MOCKED_TASKS);
        expect(taskService.tasks()).toEqual(MOCKED_TASKS);
      });

      const req = httpTestingController.expectOne(`${apiUrl}/tasks`);

      req.flush(MOCKED_TASKS);

      expect(req.request.method).toEqual('GET');
    }));

    it('should throw and error when server return Internal server error', waitForAsync(() => {
      let httpErrorResponse: HttpErrorResponse | undefined;

      taskService.getTasks().subscribe({
        next: () => {
          fail('failed to fetch the tasks list');
        },
        error: (error: HttpErrorResponse) => {
          httpErrorResponse = error;
        },
      });

      const req = httpTestingController.expectOne(`${apiUrl}/tasks`);

      req.flush('Internal server error', TASK_INTERNAL_SERVER_ERROR_RESPONSE);

      if (!httpErrorResponse) {
        throw new Error('Error needs to be defined');
      }

      expect(httpErrorResponse.status).toEqual(500);
      expect(httpErrorResponse.statusText).toEqual('Internal Server Error');
    }));
  });

  describe('createTask', () => {
    it('should create a new task with waitForAsync', waitForAsync(() => {
      let task: Task | undefined;

      taskService.createTask(MOCKED_TASK).subscribe(response => {
        task = response;
      });

      const req = httpTestingController.expectOne(`${apiUrl}/tasks`);

      req.flush(MOCKED_TASK);

      expect(task).toEqual(MOCKED_TASK);
      expect(req.request.method).toEqual('POST');
    }));

    it('should create a new task', () => {
      let task: Task | undefined;

      taskService.createTask(MOCKED_TASK).subscribe(response => {
        task = response;
      });

      const req = httpTestingController.expectOne(`${apiUrl}/tasks`);

      req.flush(MOCKED_TASK);

      expect(task).toEqual(MOCKED_TASK);
      expect(req.request.method).toEqual('POST');
    });

    it('should throw unprocessable entity with invalid body when create a task', waitForAsync(() => {
      let httpErrorResponse: HttpErrorResponse | undefined;

      taskService.createTask(MOCKED_TASK).subscribe({
        next: () => {
          fail('failed to add a new task');
        },
        error: (error: HttpErrorResponse) => {
          httpErrorResponse = error;
        },
      });

      const req = httpTestingController.expectOne(`${apiUrl}/tasks`);

      req.flush('Unprocessable Entity', TASK_UNPROCESSIBLE_ENTITY_RESPONSE);

      if (!httpErrorResponse) {
        throw new Error('Error needs to be defined');
      }

      expect(httpErrorResponse.status).toEqual(422);
      expect(httpErrorResponse.statusText).toEqual('Unprocessable Entity');
    }));
  });

  describe('updateTask', () => {
    it('should update a task', waitForAsync(() => {
      taskService.tasks.set([MOCKED_TASK]);

      const updatedTask = MOCKED_TASK;
      updatedTask.title = 'Ir na academia treinar perna';

      taskService.updateTask(updatedTask).subscribe(() => {
        expect(taskService.tasks()[0].title).toEqual(
          'Ir na academia treinar perna'
        );
      });

      const req = httpTestingController.expectOne(
        `${apiUrl}/tasks/${updatedTask.id}`
      );

      req.flush(MOCKED_TASK);

      expect(req.request.method).toEqual('PUT');
    }));

    it('should throw unprocessable entity with invalid body when update a task', waitForAsync(() => {
      let httpErrorResponse: HttpErrorResponse | undefined;

      taskService.tasks.set([MOCKED_TASK]);

      const updatedTask = MOCKED_TASK;
      updatedTask.title = 'Ir na academia treinar perna';

      taskService.updateTask(updatedTask).subscribe({
        next: () => {
          fail('failed to update a task');
        },
        error: (error: HttpErrorResponse) => {
          httpErrorResponse = error;
        },
      });

      const req = httpTestingController.expectOne(
        `${apiUrl}/tasks/${updatedTask.id}`
      );

      req.flush('Unprocessable Entity', TASK_UNPROCESSIBLE_ENTITY_RESPONSE);

      if (!httpErrorResponse) {
        throw new Error('Error needs to be defined');
      }

      expect(httpErrorResponse.status).toEqual(422);
      expect(httpErrorResponse.statusText).toEqual('Unprocessable Entity');
    }));
  });

  describe('updateIsCompletedStatus', () => {
    it('should update IsCompletedStatus of a task', waitForAsync(() => {
      const updatedTask = MOCKED_TASK;
      const methodUrl = `${apiUrl}/tasks/${updatedTask.id}`;

      taskService.tasks.set(MOCKED_TASKS);

      taskService
        .updateIsCompletedStatus(updatedTask.id, true)
        .subscribe(() => {
          expect(taskService.tasks()[0].isCompleted).toBeTruthy();
        });

      const req = httpTestingController.expectOne(methodUrl);

      req.flush({ isCompleted: true });

      expect(req.request.method).toEqual('PATCH');
    }));

    it('should throw and error when update a tasks isCompleted status', waitForAsync(() => {
      let httpErrorResponse: HttpErrorResponse | undefined;

      const updatedTask = MOCKED_TASK;
      const methodUrl = `${apiUrl}/tasks/${updatedTask.id}`;

      taskService.tasks.set(MOCKED_TASKS);

      taskService.updateIsCompletedStatus(updatedTask.id, true).subscribe({
        next: () => {
          fail('failed to update a task isCompleted status');
        },
        error: (error: HttpErrorResponse) => {
          httpErrorResponse = error;
        },
      });

      const req = httpTestingController.expectOne(methodUrl);

      req.flush('Unprocessable Entity', TASK_UNPROCESSIBLE_ENTITY_RESPONSE);

      if (!httpErrorResponse) {
        throw new Error('Error needs to be defined');
      }

      expect(httpErrorResponse.status).toEqual(422);
      expect(httpErrorResponse.statusText).toEqual('Unprocessable Entity');
    }));
  });

  describe('deleteTask', () => {
    it('should delete a task', waitForAsync(() => {
      taskService.tasks.set(MOCKED_TASKS);

      taskService.deleteTask(MOCKED_TASK.id).subscribe(() => {
        expect(taskService.tasks().length).toEqual(1);
      });

      const req = httpTestingController.expectOne(
        `${apiUrl}/tasks/${MOCKED_TASK.id}`
      );

      req.flush(null);

      expect(req.request.method).toEqual('DELETE');
    }));

    it('should throw unprocessable entity with invalid body when delete a task', waitForAsync(() => {
      let httpErrorResponse: HttpErrorResponse | undefined;

      taskService.tasks.set([MOCKED_TASK]);

      taskService.deleteTask(MOCKED_TASK.id).subscribe({
        next: () => {
          fail('failed to delete a task');
        },
        error: (error: HttpErrorResponse) => {
          httpErrorResponse = error;
        },
      });

      const req = httpTestingController.expectOne(
        `${apiUrl}/tasks/${MOCKED_TASK.id}`
      );

      req.flush('Unprocessable Entity', TASK_UNPROCESSIBLE_ENTITY_RESPONSE);

      if (!httpErrorResponse) {
        throw new Error('Error needs to be defined');
      }

      expect(httpErrorResponse.status).toEqual(422);
      expect(httpErrorResponse.statusText).toEqual('Unprocessable Entity');
    }));
  });
});
