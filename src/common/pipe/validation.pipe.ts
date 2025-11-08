import { BadRequestException, ValidationPipeOptions } from "@nestjs/common";

export const validationPipeOptions: ValidationPipeOptions = {
  transform: true,                    // auto-transform payload types
  transformOptions: {
    enableImplicitConversion: true,   // allow type conversion
  },
  whitelist: true,                    // strip unknown properties
  forbidNonWhitelisted: true,         // throw if extra fields exist
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map(err => ({
      property: err.property,
      constraints: err.constraints,
      children: err.children?.length ? formatChildErrors(err.children) : undefined,
    }));
    return new BadRequestException({
      message: 'Validation failed',
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