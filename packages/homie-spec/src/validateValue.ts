type SuccessResult = {
  raw: string;
  value: unknown;
  valid: true;
};

type FailResult = {
  raw: string;
  valid: false;
  message: string;
};

type Result = SuccessResult | FailResult;

export type ResultByDatatype = {
  integer: IntegerResult;
  float: FloatResult;
  boolean: BooleanResult;
  string: StringResult;
  enum: EnumResult;
  color: ColorResult;
};

export function validateValue(
  { format, datatype }: { format?: string; datatype: string },
  raw: string,
) {
  switch (datatype) {
    case "integer":
      return validateInteger(raw, format);
    case "float":
      return validateFloat(raw, format);
    case "boolean":
      return validateBoolean(raw, format);
    case "string":
      return validateString(raw, format);
    case "enum":
      return validateEnum(raw, format);
    case "color":
      return validateColor(raw, format);
    default:
      return {
        raw,
        valid: false,
        message: `Datatype not supported: ${datatype}`,
      };
  }
}

type IntegerSuccessResult = SuccessResult & { value: number };
type IntegerResult = IntegerSuccessResult | FailResult;

function validateInteger(raw: string, format?: string): IntegerResult {
  let value = parseInt(raw, 10);

  if (isNaN(value)) {
    return {
      raw,
      valid: false,
      message: "Invalid integer",
    };
  }

  if (format) {
    const [min, max, step] = format
      .split(":")
      .map((v: string) => parseInt(v, 10))
      .map((v) => (isNaN(v) ? null : v));

    if (step != null) {
      let base = min != null ? min : max != null ? max : value;

      while (base > value) {
        base -= step;
      }

      value = Math.round((value - base) / step) * step + base;
    }

    if (min != null && value < min) {
      return {
        raw,
        valid: false,
        message: "Value too low",
      };
    }

    if (max != null && value > max) {
      return {
        raw,
        valid: false,
        message: "Value too high",
      };
    }

    return {
      raw,
      value,
      valid: true,
    };
  }

  return {
    raw,
    value: value,
    valid: true,
  };
}

type FloatSuccessResult = SuccessResult & { value: number };
type FloatResult = FloatSuccessResult | FailResult;

function validateFloat(raw: string, _format?: string): FloatResult {
  const value = parseInt(raw, 10);

  if (isNaN(value)) {
    return {
      raw,
      valid: false,
      message: "Invalid integer",
    };
  }

  return {
    raw,
    value,
    valid: true,
  };
}

type BooleanSuccessResult = SuccessResult & { value: boolean };
type BooleanResult = BooleanSuccessResult | FailResult;

function validateBoolean(raw: string, _format?: string): BooleanResult {
  if (raw === "true" || raw === "false") {
    return {
      raw,
      value: JSON.parse(raw),
      valid: true,
    };
  }

  return {
    raw,
    valid: false,
    message: "Invalid boolean",
  };
}

type StringSuccessResult = SuccessResult & { value: string };
type StringResult = StringSuccessResult | FailResult;

function validateString(raw: string, _format?: string): StringResult {
  if (raw.length > 268_435_456) {
    return {
      raw,
      valid: false,
      message:
        "String too long. Maximum allowed length is 268,435,456 characters.",
    };
  }

  return {
    raw,
    value: raw,
    valid: true,
  };
}

type EnumSuccessResult = SuccessResult & { value: string };
type EnumResult = EnumSuccessResult | FailResult;

function validateEnum(raw: string, format?: string): EnumResult {
  if (format?.split(",").includes(raw)) {
    return {
      raw,
      value: raw,
      valid: true,
    };
  }

  return {
    raw,
    valid: false,
    message: "Invalid enum value",
  };
}

type ColorSuccessResult = SuccessResult & { value: string };
type ColorResult = ColorSuccessResult | FailResult;

function validateColor(raw: string, _format?: string): ColorResult {
  const colorMatcher = /^#[0-9a-fA-F]{6}$/;

  if (colorMatcher.test(raw)) {
    return {
      raw,
      value: raw,
      valid: true,
    };
  }

  return {
    raw,
    valid: false,
    message: "Invalid color",
  };
}
