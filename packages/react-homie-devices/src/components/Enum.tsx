type EnumProps<Options extends string[]> = {
  id: string;
  name?: string;
  options: Options;
  value?: Options[number];
  target?: Options[number];
  retained?: boolean;
  onSet?: (value: Options[number]) => void;
};

export function Enum<Options extends string[]>(
  props: EnumProps<Options>,
) {
  const format = props.options.join(",");

  return (
    <property$
      id={props.id}
      name={props.name}
      format={format}
      retained={props.retained}
      datatype="enum"
      value={props.value}
      target={props.target}
      onSet={props.onSet}
    />
  );
}
