import { inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';

type TaskFormControl = {
  title: FormControl<string>;
  categoryId: FormControl<string>;
};

export function createTaskForm(): FormGroup<TaskFormControl> {
  const formBuilder = inject(NonNullableFormBuilder);

  return formBuilder.group({
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
    categoryId: new FormControl('1', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
}

export type TaskFormGroup = ReturnType<typeof createTaskForm>;

export type TaskFormValue = ReturnType<TaskFormGroup['getRawValue']>;
