import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

export type FormFieldContext<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>;
};
