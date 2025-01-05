import { HttpStatus, Injectable, ValidationPipe } from '@nestjs/common';
import {
  ErrorHttpStatusCode,
  HttpErrorByCode,
} from '@nestjs/common/utils/http-error-by-code.util';
import { ValidationError } from 'class-validator';

@Injectable()
export class BodyValidationPipe extends ValidationPipe {
  protected isTransformEnabled = true;
  protected errorHttpStatusCode: ErrorHttpStatusCode =
    HttpStatus.UNPROCESSABLE_ENTITY;

  public createExceptionFactory(): (
    validationErrors?: ValidationError[],
  ) => unknown {
    return (validationErrors: ValidationError[] = []) => {
      if (this.isDetailedOutputDisabled) {
        return new HttpErrorByCode[this.errorHttpStatusCode]();
      }
      const errors = this.flattenValidationErrors(validationErrors);
      return new HttpErrorByCode[this.errorHttpStatusCode](
        {
          message: 'The input data is incorrect',
          errors: errors,
        },
        {
          cause: 'BodyValidationPipe',
          description: 'The input data is incorrect',
        },
      );
    };
  }
}
