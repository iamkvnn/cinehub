import { BadRequestException, ValidationPipeOptions } from "@nestjs/common";
import { ERROR_MESSAGES } from "../const/const";

export const validationPipeOptions: ValidationPipeOptions = {
  transform: true,                    // auto-transform payload types
  transformOptions: {
    enableImplicitConversion: true,   // allow type conversion
  },
  whitelist: true,                    // strip unknown properties
  forbidNonWhitelisted: false,         // throw if extra fields exist
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map(err => ({
      property: err.property,
      constraints: err.constraints,
      children: err.children?.length ? formatChildErrors(err.children) : undefined,
    }));
    return new BadRequestException({
      message: ERROR_MESSAGES.INVALID_INPUT,
      errors: formattedErrors,
    });
  }
};

function formatChildErrors(errors: any[]): any[] {
  return errors.map(err => ({
    property: err.property,
    constraints: err.constraints,
    children: err.children?.length ? formatChildErrors(err.children) : undefined,
  }));
}