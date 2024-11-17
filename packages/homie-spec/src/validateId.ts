type SuccessResult = {
  valid: true;
};

type FailResult = {
  valid: false;
  message: string;
};

type Result = SuccessResult | FailResult;

export function validateId(id: string): Result {
  if (!id.match(/^[a-z0-9-]+$/)) {
    return {
      valid: false,
      message: "Invalid characters in ID",
    };
  }

  return {
    valid: true,
  };
}
