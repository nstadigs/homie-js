import { minMaxStepFormat } from "./utils.ts";

export type FloatProps = {
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

export function Float(
  props: FloatProps,
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
      datatype="float"
      id={props.id}
      name={props.name}
      format={format}
      onSet={props.onSet}
    />
  );
}
