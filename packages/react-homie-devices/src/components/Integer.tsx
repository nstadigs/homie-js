import { minMaxStepFormat } from "./utils.ts";

export type IntegerProps = {
  id: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  name?: string;
  retained?: boolean;
  settable?: boolean;
  unit?: string;
  onSet?: (value: number) => void;
};

export function Integer(
  props: IntegerProps,
) {
  const format = minMaxStepFormat(
    props.min,
    props.max,
    props.step,
  );

  return (
    <property$
      retained={props.retained}
      settable={props.settable}
      value={props.value}
      unit={props.unit}
      datatype="integer"
      id={props.id}
      name={props.name}
      format={format}
      onSet={props.onSet}
    />
  );
}
