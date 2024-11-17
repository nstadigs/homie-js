type SuccessResult = {
  valid: true;
};

type FailResult = {
  valid: false;
  message: string;
};

type Result = SuccessResult | FailResult;

export function validateFormat({
  datatype,
  format,
}: {
  datatype: string;
  format: string;
}): Result {
  switch (datatype) {
    case "integer":
      return validateIntegerFormat(format);
    case "float":
      return validateFloatFormat(format);
    case "boolean":
      return validateBooleanFormat(format);
    case "string":
      return validateStringFormat(format);
    case "enum":
      return validateEnumFormat(format);
    case "color":
      return validateColorFormat(format);
    default:
      return {
        valid: false,
        message: `Datatype not supported: ${datatype}`,
      };
  }
}

function validateIntegerFormat(format: string): Result {
  return {
    valid: true,
  };
}

function validateFloatFormat(format: string): Result {
  return {
    valid: true,
  };
}

function validateBooleanFormat(format: string): Result {
  if (format == null) {
    return {
      valid: true,
    };
  }

  const parts = new Set(format.split(","));

  if (parts.size !== 2) {
    return {
      valid: false,
      message: "",
    };
  }

  if (parts.has("")) {
    return {
      valid: false,
      message: "",
    };
  }

  return {
    valid: true,
  };
}

function validateStringFormat(format: string): Result {
  return {
    valid: true,
  };
}

function validateEnumFormat(format: string): Result {
  return {
    valid: true,
  };
}

function validateColorFormat(format: string): Result {
  return {
    valid: true,
  };
}
